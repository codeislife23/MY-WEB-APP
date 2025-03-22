from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import os
import tempfile
import subprocess
import uuid
import shutil
import time
import json
import threading
import queue
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs')
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac', 'm4a'}

# Dictionary to store progress information
progress_data = {}

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def check_ffmpeg():
    """Check if FFmpeg is installed and accessible in PATH"""
    try:
        # Try to find FFmpeg in PATH
        ffmpeg_path = shutil.which('ffmpeg')
        
        # If not found in PATH, check common system locations
        if not ffmpeg_path:
            common_locations = [
                '/usr/bin/ffmpeg',
                '/usr/local/bin/ffmpeg',
                '/bin/ffmpeg',
                '/opt/homebrew/bin/ffmpeg',  # For macOS Homebrew
                '/opt/local/bin/ffmpeg',     # For macOS MacPorts
                '/snap/bin/ffmpeg'           # For Ubuntu snap
            ]
            
            for location in common_locations:
                if os.path.exists(location) and os.access(location, os.X_OK):
                    ffmpeg_path = location
                    break
                    
        if ffmpeg_path:
            result = subprocess.run([ffmpeg_path, '-version'], 
                                  capture_output=True, text=True, check=True)
            return {
                'installed': True,
                'path': ffmpeg_path,
                'version': result.stdout.split('\n')[0]
            }
        else:
            return {
                'installed': False,
                'error': 'FFmpeg executable not found in PATH or common locations'
            }
    except Exception as e:
        return {
            'installed': False,
            'error': str(e)
        }

@app.route('/api/models', methods=['GET'])
def get_models():
    """Get available models by running audio-separator --list_models"""
    try:
        print("Attempting to run audio-separator --list_models")
        result = subprocess.run(['audio-separator', '--list_models'], 
                              capture_output=True, text=True, check=True)
        
        print(f"Command output: {result.stdout}")
        
        # Parse the output to extract model names
        models = []
        lines = result.stdout.split('\n')
        for line in lines:
            if line.strip() and not line.startswith('Available models'):
                # Extract just the model filename - these usually end with .onnx, .ckpt, .pt, or .pth
                # Look for the first word or phrase that ends with a model extension
                parts = line.split()
                model_name = None
                for part in parts:
                    part = part.strip()
                    if part.endswith(('.onnx', '.ckpt', '.pt', '.pth', '.yaml')):
                        model_name = part
                        break
                
                # If we couldn't find a part with a model extension, try the first part before a space
                if not model_name and len(parts) > 0:
                    model_name = parts[0].strip()
                
                if model_name:
                    models.append(model_name)
        
        if not models:
            print("No models found in the output, using default models")
            # Provide some default models that are commonly available
            models = [
                'UVR-MDX-NET-Inst_HQ_3.onnx',
                'UVR_MDXNET_KARA_2.onnx',
                'Kim_Vocal_2.onnx',
                'UVR-MDX-NET-Inst_3.onnx'
            ]
        
        print(f"Returning models: {models}")
        return jsonify({'models': models})
    except subprocess.CalledProcessError as e:
        print(f"Error running audio-separator --list_models: {e}")
        print(f"stderr: {e.stderr}")
        # Return some default models if the command fails
        default_models = [
            'UVR-MDX-NET-Inst_HQ_3.onnx',
            'UVR_MDXNET_KARA_2.onnx'
        ]
        return jsonify({'models': default_models, 'note': 'Using default models due to error'})
    except Exception as e:
        print(f"Unexpected error in get_models: {str(e)}")
        # Return a single default model as a fallback
        return jsonify({'models': ['UVR-MDX-NET-Inst_HQ_3.onnx'], 'note': 'Using default model due to error'})

def process_audio_in_thread(job_id, filepath, model, job_dir, result_queue):
    """Process audio in a separate thread and track progress"""
    try:
        # First check if FFmpeg is available
        ffmpeg_status = check_ffmpeg()
        if not ffmpeg_status['installed']:
            raise Exception(f"FFmpeg is not installed or not in PATH: {ffmpeg_status['error']}")
        
        # Update progress to 10% - File uploaded and processing started
        progress_data[job_id] = {
            'progress': 10,
            'status': 'Processing started',
            'complete': False,
            'error': None
        }
        
        # Clean the model name - extract just the filename part
        if model:
            model = model.split()[0].strip()  # Take just the first word
        
        print(f"Using model: {model}")
        
        # Run audio-separator with proper arguments
        # The correct format is: audio-separator input.mp3 --output_dir=path
        cmd = ['audio-separator', filepath]
        
        # Add output_dir parameter
        cmd.append(f'--output_dir={job_dir}')
        
        # Add model parameter if specified
        if model and model != 'default':
            cmd.append(f'--model_filename={model}')
        
        print(f"Running command: {' '.join(cmd)}")
        
        # Create environment with FFMPEG_PATH set
        env = os.environ.copy()
        env['FFMPEG_PATH'] = ffmpeg_status['path']
        print(f"Setting FFMPEG_PATH to {ffmpeg_status['path']}")
        
        # Start the process with the modified environment
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True,
            env=env
        )
        
        # Update progress to 20% - Separation process started
        progress_data[job_id]['progress'] = 20
        progress_data[job_id]['status'] = 'Separation process started'
        
        # Read output line by line to estimate progress
        start_time = time.time()
        output_lines = []
        error_lines = []
        
        # Read stdout and stderr
        for line in process.stdout:
            output_lines.append(line)
            
            # Update progress based on time passed and typical processing time
            elapsed_time = time.time() - start_time
            # Estimate progress: 20% at start, up to 90% based on elapsed time
            # Most separations take 30-120 seconds, so we'll use a simple formula
            # that reaches 90% after about 60 seconds
            estimated_progress = min(20 + (elapsed_time / 60) * 70, 90)
            
            progress_data[job_id]['progress'] = int(estimated_progress)
            progress_data[job_id]['status'] = 'Processing audio...'
            
            # Look for progress indicators in the output
            if "Loading model" in line:
                progress_data[job_id]['status'] = 'Loading model...'
            elif "Processing" in line:
                progress_data[job_id]['status'] = 'Processing audio...'
            elif "Saving" in line:
                progress_data[job_id]['status'] = 'Saving separated tracks...'
        
        # Get any remaining stderr
        for line in process.stderr:
            error_lines.append(line)
        
        # Wait for the process to complete
        process.wait()
        
        # Check if process was successful
        if process.returncode == 0:
            # Get output files
            output_files = []
            for f in os.listdir(job_dir):
                if os.path.isfile(os.path.join(job_dir, f)):
                    output_files.append(f)
            
            # Update progress to 100% - Complete
            progress_data[job_id]['progress'] = 100
            progress_data[job_id]['status'] = 'Complete'
            progress_data[job_id]['complete'] = True
            
            print(f"Separation complete. Output files: {output_files}")
            result_queue.put({
                'job_id': job_id,
                'success': True,
                'message': 'Separation completed successfully',
                'output_files': output_files,
                'stdout': ''.join(output_lines)
            })
        else:
            error_message = ''.join(error_lines)
            print(f"Error during separation: {error_message}")
            
            # Update progress with error
            progress_data[job_id]['progress'] = 0
            progress_data[job_id]['status'] = 'Error'
            progress_data[job_id]['error'] = error_message
            progress_data[job_id]['complete'] = True
            
            result_queue.put({
                'job_id': job_id,
                'success': False,
                'error': f"Error during separation: return code {process.returncode}",
                'stderr': error_message
            })
    except Exception as e:
        print(f"Unexpected error in process_audio_in_thread: {str(e)}")
        
        # Update progress with error
        progress_data[job_id]['progress'] = 0
        progress_data[job_id]['status'] = 'Error'
        progress_data[job_id]['error'] = str(e)
        progress_data[job_id]['complete'] = True
        
        result_queue.put({
            'job_id': job_id,
            'success': False,
            'error': f"Unexpected error: {str(e)}"
        })
    finally:
        # Clean up uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/separate', methods=['POST'])
def separate_audio():
    """Separate audio using audio-separator"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    try:
        # Generate a unique ID for this separation job
        job_id = str(uuid.uuid4())
        job_dir = os.path.join(OUTPUT_FOLDER, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, f"{job_id}_{filename}")
        file.save(filepath)
        
        # Initialize progress tracking
        progress_data[job_id] = {
            'progress': 5,
            'status': 'File uploaded',
            'complete': False,
            'error': None
        }
        
        # Get parameters
        model = request.form.get('model', 'UVR-MDX-NET-Inst_HQ_3.onnx')  # Default model
        
        # Create a queue for the thread to return results
        result_queue = queue.Queue()
        
        # Start processing in a separate thread to not block the response
        processing_thread = threading.Thread(
            target=process_audio_in_thread,
            args=(job_id, filepath, model, job_dir, result_queue)
        )
        processing_thread.daemon = True
        processing_thread.start()
        
        # Return the job ID immediately so the client can check progress
        return jsonify({
            'job_id': job_id,
            'message': 'Separation process started',
            'status': 'processing'
        })
    
    except Exception as e:
        print(f"Unexpected error in separate_audio: {str(e)}")
        
        # Clean up on error
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        if 'job_dir' in locals() and os.path.exists(job_dir):
            shutil.rmtree(job_dir)
            
        return jsonify({'error': f"Unexpected error: {str(e)}"}), 500

@app.route('/api/progress/<job_id>', methods=['GET'])
def get_progress(job_id):
    """Get progress of a separation job"""
    if job_id in progress_data:
        return jsonify(progress_data[job_id])
    else:
        return jsonify({'error': 'Job not found'}), 404

@app.route('/api/result/<job_id>', methods=['GET'])
def get_result(job_id):
    """Get result of a completed separation job"""
    if job_id in progress_data and progress_data[job_id]['complete']:
        # If job completed with an error
        if progress_data[job_id]['error']:
            return jsonify({
                'job_id': job_id,
                'success': False,
                'error': progress_data[job_id]['error']
            }), 500
        
        # If job completed successfully
        output_files = []
        job_dir = os.path.join(OUTPUT_FOLDER, job_id)
        if os.path.exists(job_dir):
            for f in os.listdir(job_dir):
                if os.path.isfile(os.path.join(job_dir, f)):
                    output_files.append(f)
        
        return jsonify({
            'job_id': job_id,
            'success': True,
            'message': 'Separation completed successfully',
            'output_files': output_files
        })
    
    elif job_id in progress_data:
        return jsonify({
            'job_id': job_id,
            'success': False,
            'message': 'Job still in progress',
            'status': progress_data[job_id]['status'],
            'progress': progress_data[job_id]['progress']
        }), 202
    
    else:
        return jsonify({'error': 'Job not found'}), 404

@app.route('/api/download/<job_id>/<filename>', methods=['GET'])
def download_file(job_id, filename):
    """Download a processed file with format conversion"""
    try:
        # Don't use secure_filename here as it strips special characters like parentheses
        file_path = os.path.join(OUTPUT_FOLDER, job_id, filename)
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Get requested format from query parameter (default to original format)
        requested_format = request.args.get('format', '').lower()
        valid_formats = ['wav', 'mp3', 'flac', 'aac']
        
        # Extract the original filename without the job_id prefix and extension
        original_filename = filename
        if original_filename.startswith(job_id):
            # Remove the job_id prefix and the underscore
            original_filename = original_filename[len(job_id) + 1:]
        
        # Extract original file extension
        original_ext = original_filename.split('.')[-1].lower()
            
        # Extract stem type from the filename
        stem_suffix = ""
        if '(Vocals)' in filename:
            stem_suffix = "-Vocals"
        elif '(Instrumental)' in filename:
            stem_suffix = "-Instrumental"
        elif '(Drums)' in filename:
            stem_suffix = "-Drums"
        elif '(Bass)' in filename:
            stem_suffix = "-Bass"
        elif '(Other)' in filename:
            stem_suffix = "-Other"
            
        # Remove any existing stem markers from the original filename
        clean_name = original_filename
        for marker in ['(Vocals)', '(Instrumental)', '(Drums)', '(Bass)', '(Other)']:
            clean_name = clean_name.replace(marker, '')
            
        # Remove the extension from clean_name to avoid duplicating it
        if '.' in clean_name:
            clean_name = clean_name.rsplit('.', 1)[0]
            
        # Clean up any double spaces or underscores that might have been introduced
        clean_name = clean_name.replace('  ', ' ').replace('__', '_')
        
        # If format conversion is requested and valid
        if requested_format in valid_formats and requested_format != original_ext:
            # Create a temporary file for the converted output
            fd, temp_path = tempfile.mkstemp(suffix=f'.{requested_format}')
            os.close(fd)
            
            try:
                # Prepare the FFmpeg command
                ffmpeg_cmd = [
                    shutil.which('ffmpeg') or 'ffmpeg',
                    '-i', file_path,
                    '-y'  # Overwrite output if exists
                ]
                
                # Add format-specific options
                if requested_format == 'mp3':
                    ffmpeg_cmd.extend(['-c:a', 'libmp3lame', '-q:a', '2'])
                elif requested_format == 'aac':
                    ffmpeg_cmd.extend(['-c:a', 'aac', '-b:a', '256k'])
                elif requested_format == 'wav':
                    ffmpeg_cmd.extend(['-c:a', 'pcm_s16le'])
                elif requested_format == 'flac':
                    ffmpeg_cmd.extend(['-c:a', 'flac'])
                
                # Add output path
                ffmpeg_cmd.append(temp_path)
                
                # Run FFmpeg conversion
                process = subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
                
                # Construct the final filename with the new extension
                download_filename = f"{clean_name}{stem_suffix}.{requested_format}"
                
                # Set appropriate MIME type
                if requested_format == 'mp3':
                    mimetype = 'audio/mpeg'
                elif requested_format == 'aac':
                    mimetype = 'audio/aac'
                elif requested_format == 'wav':
                    mimetype = 'audio/wav'
                else:  # flac
                    mimetype = 'audio/flac'
                
                # Send the converted file
                response = send_file(
                    temp_path,
                    as_attachment=True,
                    download_name=download_filename,
                    mimetype=mimetype
                )
                
                # Add cleanup callback to remove temp file after response is sent
                @response.call_on_close
                def cleanup():
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                
                # Add additional headers to help with download issues
                response.headers['X-Content-Type-Options'] = 'nosniff'
                response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
                return response
                
            except Exception as e:
                # Clean up temp file if conversion fails
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                print(f"Conversion error: {str(e)}")
                # Fall back to original file if conversion fails
                pass
        
        # If no conversion was requested or conversion failed, send original file
        # Construct the final filename with the original extension
        download_filename = f"{clean_name}{stem_suffix}.{original_ext}"
        
        # Set mimetype based on the original file extension
        if original_ext == 'mp3':
            mimetype = 'audio/mpeg'
        elif original_ext == 'aac':
            mimetype = 'audio/aac'
        elif original_ext == 'wav':
            mimetype = 'audio/wav'
        else:  # flac or other
            mimetype = 'audio/flac'
        
        response = send_file(
            file_path,
            as_attachment=True,
            download_name=download_filename,
            mimetype=mimetype
        )
        
        # Add additional headers to help with download issues
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return jsonify({'error': f"Error downloading file: {str(e)}"}), 500

@app.route('/api/check-installation', methods=['GET'])
def check_installation():
    """Check if all required dependencies are installed and working"""
    results = {}
    
    # Check FFmpeg
    ffmpeg_status = check_ffmpeg()
    results['ffmpeg'] = ffmpeg_status
    
    # Check audio-separator
    try:
        result = subprocess.run(['audio-separator', '--version'], 
                              capture_output=True, text=True, check=True)
        results['audio_separator'] = {
            'installed': True,
            'version': result.stdout.strip(),
            'message': 'audio-separator is installed and working'
        }
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        error_message = str(e)
        if isinstance(e, subprocess.CalledProcessError) and e.stderr:
            error_message += f"\nError output: {e.stderr}"
        
        results['audio_separator'] = {
            'installed': False,
            'message': f'audio-separator is not installed or not working properly: {error_message}'
        }
    
    # Check if all required dependencies are installed
    all_installed = all(item.get('installed', False) for item in results.values())
    
    return jsonify({
        'all_installed': all_installed,
        'dependencies': results,
        'message': 'All dependencies installed and working' if all_installed else 'Some dependencies are missing'
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 
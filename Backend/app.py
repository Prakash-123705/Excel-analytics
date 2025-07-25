# backend/app.py

import os
import io
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import jwt
import datetime
from functools import wraps

# --- Configuration ---
app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
app.config['SECRET_KEY'] = 'your_super_secret_key_change_me' # IMPORTANT: Change this in production
app.config['UPLOAD_FOLDER'] = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

# Enable CORS for the React frontend
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# --- In-memory "Database" for Demo Purposes ---
# In a real application, replace this with a proper database like PostgreSQL or SQLite
users = {}
files_db = {}

# --- Utility Functions ---
def allowed_file(filename):
    """Checks if the uploaded file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- JWT Token Handling ---
def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users.get(data['email'])
            if not current_user:
                 return jsonify({'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

# --- Data Processing Functions ---
def process_datafile(file_path, file_extension):
    """Reads a data file and generates summary and chart data."""
    try:
        if file_extension == 'csv':
            df = pd.read_csv(file_path, on_bad_lines='skip')
        else: # xlsx, xls
            df = pd.read_excel(file_path)

        # Clean up column names
        df.columns = df.columns.str.strip()

        # --- Generate Summary ---
        total_rows = len(df)
        total_cols = len(df.columns)
        missing_values = df.isnull().sum().to_dict()
        total_missing = sum(missing_values.values())
        
        # Identify data types
        data_types = {col: 'Numeric' if pd.api.types.is_numeric_dtype(df[col]) else 'Categorical' for col in df.columns}

        summary = {
            'totalRows': total_rows,
            'totalCols': total_cols,
            'missingValues': missing_values,
            'totalMissing': int(total_missing),
            'dataTypes': data_types,
            'previewData': df.head(5).to_dict(orient='records'),
            'headers': list(df.columns)
        }

        # --- Generate Chart Data ---
        charts = {}
        numeric_cols = [col for col, dtype in data_types.items() if dtype == 'Numeric']
        categorical_cols = [col for col, dtype in data_types.items() if dtype == 'Categorical']

        if numeric_cols and categorical_cols:
            cat_col = categorical_cols[0]
            num_col = numeric_cols[0]

            # Prepare data for charts (convert to JSON-serializable types)
            chart_df = df[[cat_col, num_col]].dropna().copy()
            chart_df[num_col] = pd.to_numeric(chart_df[num_col], errors='coerce')
            chart_df = chart_df.dropna()
            
            # Bar/Line Chart Data
            bar_line_data = chart_df.to_dict(orient='records')

            # Pie Chart Data (Top 6 categories)
            pie_data = df[cat_col].value_counts().nlargest(6).reset_index()
            pie_data.columns = ['name', 'value']
            
            charts = {
                'bar': {'data': bar_line_data, 'x': cat_col, 'y': num_col},
                'line': {'data': bar_line_data, 'x': cat_col, 'y': num_col},
                'pie': {'data': pie_data.to_dict(orient='records'), 'name': 'name', 'value': 'value'},
            }

        return {'summary': summary, 'charts': charts}

    except Exception as e:
        print(f"Error processing file: {e}")
        return None


# --- API Endpoints ---

@app.route('/api/register', methods=['POST'])
def register():
    """Handles user registration."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    if email in users:
        return jsonify({'message': 'User already exists'}), 409

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    users[email] = {'email': email, 'password': hashed_password}
    
    # In a real app, you would now save this to your database
    print("USERS DB:", users)

    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Handles user login and JWT token generation."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users.get(email)

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401

    token = jwt.encode({
        'email': user['email'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({'token': token, 'email': user['email']})

@app.route('/api/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    """Handles file upload and triggers data processing."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        
        # Save file securely
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Process the data
        analysis_result = process_datafile(file_path, file_extension)

        if analysis_result:
            # Store file info (in a real app, use a DB)
            file_id = str(len(files_db) + 1)
            files_db[file_id] = {
                'user_email': current_user['email'],
                'filename': filename,
                'upload_time': datetime.datetime.utcnow().isoformat(),
                'file_path': file_path
            }
            return jsonify(analysis_result)
        else:
            return jsonify({'error': 'Failed to process the file'}), 500

    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/history', methods=['GET'])
@token_required
def get_history(current_user):
    """Returns the upload history for the current user."""
    user_email = current_user['email']
    user_files = [f for f in files_db.values() if f['user_email'] == user_email]
    # Sort by most recent
    user_files.sort(key=lambda x: x['upload_time'], reverse=True)
    return jsonify(user_files)

# --- Serve React App ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serves the static files for the React app."""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Create upload directory if it doesn't exist
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug=True, port=5001) # Running on a different port than React dev server

from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Dosya yükleme için klasör oluşturma
UPLOAD_FOLDER = 'uploads'
DEFAULT_PROFILE_PICTURE = 'uploads/default-profile.png'  # Varsayılan profil fotoğrafı yolu
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# MongoDB bağlantısı
client = MongoClient('mongodb://localhost:27017/')
db = client['mydatabase']

@app.route('/add_user', methods=['POST'])
def add_user():
    data = request.form
    name = data.get('name')
    surname = data.get('surname')
    email = data.get('email')
    phone = data.get('phone')
    school = data.get('school')
    department = data.get('department')
    gender = data.get('gender')
    birthdate = data.get('birthdate')

    # Profil fotoğrafını yükleme
    profile_picture = DEFAULT_PROFILE_PICTURE  # Varsayılan olarak profil fotoğrafı
    if 'profile_picture' in request.files:
        profile_picture_file = request.files['profile_picture']
        profile_picture_path = os.path.join(app.config['UPLOAD_FOLDER'], profile_picture_file.filename)
        profile_picture_file.save(profile_picture_path)
        profile_picture = profile_picture_path

    if not name or not surname or not email or not phone or not school or not department or not gender or not birthdate:
        return jsonify({'error': 'All fields are required'}), 400

    user = {
        'name': name,
        'surname': surname,
        'email': email,
        'phone': phone,
        'school': school,
        'department': department,
        'profile_picture': profile_picture,
        'gender': gender,
        'birthdate': birthdate
    }

    db.users.insert_one(user)
    return jsonify({'message': 'User added successfully!'}), 201

@app.route('/get_user/<email>', methods=['GET'])
def get_user(email):
    user = db.users.find_one({'email': email})
    if user:
        return jsonify({
            'name': user['name'],
            'surname': user['surname'],
            'email': user['email'],
            'phone': user['phone'],
            'school': user['school'],
            'department': user['department'],
            'profile_picture': user['profile_picture'],
            'gender': user['gender'],
            'birthdate': user['birthdate']
        }), 200
    return jsonify({'error': 'User not found'}), 404

@app.route('/update_user/<email>', methods=['PUT'])
def update_user(email):
    data = request.form
    updated_user = {
        'name': data.get('name'),
        'surname': data.get('surname'),
        'email': data.get('email'),
        'phone': data.get('phone'),
        'school': data.get('school'),
        'department': data.get('department'),
        'gender': data.get('gender'),
        'birthdate': data.get('birthdate')
    }

    # Profil fotoğrafını güncelleme
    if 'profile_picture' in request.files:
        profile_picture_file = request.files['profile_picture']
        profile_picture_path = os.path.join(app.config['UPLOAD_FOLDER'], profile_picture_file.filename)
        profile_picture_file.save(profile_picture_path)
        updated_user['profile_picture'] = profile_picture_path
    elif not updated_user.get('profile_picture'):
        updated_user['profile_picture'] = DEFAULT_PROFILE_PICTURE

    result = db.users.update_one({'email': email}, {'$set': updated_user})
    if result.matched_count:
        return jsonify({'message': 'User updated successfully!'}), 200
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)

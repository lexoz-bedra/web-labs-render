import os
from flask import Flask, request, jsonify
from PIL import Image
import pymongo
import io

app = Flask(__name__)

@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

@app.route('/login/')
def login():
    return 'lexoz_bedra'

@app.route('/size2json/', methods=['GET', 'POST', 'OPTIONS'])
def size2json():
    file = request.files.get('image')
    img = Image.open(io.BytesIO(file.read()))
    return jsonify({'width': img.width, 'height': img.height})

@app.route('/insert/', methods=['POST', 'OPTIONS'])
def insert():
    login_val = request.form.get('login')
    password_val = request.form.get('password')
    url_val = request.form.get('URL')
    client = pymongo.MongoClient(url_val)
    db = client.get_default_database()
    db.users.insert_one({'login': login_val, 'password': password_val})
    client.close()
    return 'ok'

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port)
from flask import Flask, request, jsonify, send_from_directory
from YoutubeChessFenlist import extract_from_url

app = Flask(__name__, static_folder='../public')

# route with a url paramter
@app.route('/get_fenlist', methods=['GET'])
def get_fenlist(url):
    url = request.args.get('url', type=str)
    if url is None:
        return jsonify({"error": "No url provided"})
    return jsonify(extract_from_url(url))

@app.route('/', methods=['GET'])
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    app.run(debug=True)
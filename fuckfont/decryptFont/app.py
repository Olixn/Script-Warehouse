from flask import Flask, jsonify
from flask import request
import time
import base64
import re
from io import BytesIO
from fontTools.ttLib import TTFont
import hashlib
import json
from flask import current_app


app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'hello world'


@app.route('/decryptFont', methods=['POST'])
def decryptFont():
    start_time = time.time()
    encryptFont = request.form.get('e')
    print(encryptFont)
    fontCxSecret = request.form.get('s')
    if len(encryptFont) <= 0 or len(fontCxSecret) <= 0:
        end_time = time.time()
        data = {
            'code': 0,
            'msg': 'error!',
            't':  str(float(end_time - start_time) * 1000.0) + "ms"
        }
        return jsonify(data)
    else:
        ef = encryptFont
        df = decrypt(encryptFont, fontCxSecret)
        end_time = time.time()
        data = {
            'code': 1,
            'ef': ef,
            'df': df,
            "t": str(float(end_time - start_time) * 1000.0) + "ms"
        }
        return jsonify(data)


def decrypt(s, b):
    global kes_sign_list
    lists_base_all = []
    keylist = {}
    text_font = TTFont(BytesIO(base64.decodebytes(b.encode())))
    fileName = hashlib.md5(
        "".join(s+b).encode('utf8')).hexdigest()
    text_font.save("./tmp/" + fileName + ".ttf")
    text_font.saveXML("./tmp/" + fileName + ".xml")
    with open("./tmp/" + fileName + ".xml", encoding='utf-8') as f_baes:
        xml_base = f_baes.read()
    s_base = xml_base.split("</TTGlyph>")[:-1]
    for i in range(0, len(s_base)):
        lists_base = []
        contour = re.findall('<pt (.*?)/>', s_base[i])
        name = re.findall('name="(.*?)"', s_base[i])[0]
        for j in range(0, len(contour)):
            x = re.findall('x=\"(.*?)\"', contour[j])
            y = re.findall('y=\"(.*?)\"', contour[j])
            on = re.findall('on=\"(.*?)\"', contour[j])
            lists_base.append(x[0] + y[0] + on[0])

        keylist[name] = hashlib.md5(
            "".join(lists_base).encode('utf8')).hexdigest()
        lists_base_all.append(lists_base)
    keys_list = {}
    for i in keylist:
        keys_list[i] = kes_sign_list[keylist[i]].replace(
            "uni", "\\u").encode("utf-8").decode('unicode_escape')
    for i in s:
        j = (hex(ord(i)).replace("0x", "")).upper()
        if("uni"+j in keys_list):
            s = s.replace(i, keys_list["uni"+j])
    return s


if __name__ == '__main__':
    with open("map/map.txt", "r", encoding="utf-8") as f:
        keys = json.loads(f.read())
    kes_sign_list = {}
    for i in keys:
        kes_sign_list[keys[i]] = i
    app.run(host='127.0.0.1', port=5000)

from fontTools.ttLib import TTFont
import json
import re
import hashlib

font = TTFont('./Source Han Sans CN Normal.ttf')
# 此时就将ttf/woff文件转换为了xml文件
font.saveXML('Source Han Sans CN Normal.xml')
keylist = {}
with open('Source Han Sans CN Normal.xml', encoding='utf-8') as f_baes:
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
    print(name, x[0] + y[0] + on[0])
    keylist[name] = hashlib.md5("".join(lists_base).encode('utf8')).hexdigest()

print(keylist)
with open("map.txt", "w", encoding='utf-8') as f:
    f.write(json.dumps(keylist))

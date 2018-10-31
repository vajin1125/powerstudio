import os
import shutil
import json
from flaskext.mysql import MySQL
from flask import Flask, render_template, url_for, json, request, jsonify


app = Flask(__name__)

mysql = MySQL()
# MySQL configurations
app.config['MYSQL_DATABASE_HOST'] = 'localhost'
app.config['MYSQL_DATABASE_USER'] = 'root'
app.config['MYSQL_DATABASE_PASSWORD'] = 'mysql57'
app.config['MYSQL_DATABASE_DB'] = 'powerstudio_db'
app.config['MYSQL_DATABASE_PORT'] = 3307
mysql.init_app(app)

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))

@app.route('/')
def index():
    sources_json_url = os.path.join(SITE_ROOT, "Data", "sources_type_code.cfg")
    target_json_url = os.path.join(SITE_ROOT, "Data", "target_type_code.cfg")
    transform_json_url = os.path.join(SITE_ROOT, "Data", "transform_type_code.cfg")
    sources_json_data = json.load(open(sources_json_url))
    target_json_data = json.load(open(target_json_url))
    transform_json_data = json.load(open(transform_json_url))
    # get object data from database
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT objectname FROM objects''')
    object_data = cursor.fetchall()
    objectname_array = []
    for objdata in object_data:
        objectname_array.append(objdata)
    print(objectname_array) 
    return render_template('home.html', sources_json_data=sources_json_data, target_json_data=target_json_data, 
        transform_json_data=transform_json_data, objectdata=object_data)

@app.route('/get_sources_type_code_cfg', methods=['GET'])
def get_sources_type_code_cfg():
    json_url = os.path.join(SITE_ROOT, "Data", "sources_type_code.cfg")
    print(json_url)
    data = json.load(open(json_url))
    print("type-code:", data)
    return jsonify(data)

@app.route('/get_target_type_code_cfg', methods=['GET'])
def get_target_type_code_cfg():
    json_url = os.path.join(SITE_ROOT, "Data", "target_type_code.cfg")
    print(json_url)
    data = json.load(open(json_url))
    print("type-code:", data)
    return jsonify(data)

@app.route('/get_transform_type_code_cfg', methods=['GET'])
def get_transform_type_code_cfg():
    json_url = os.path.join(SITE_ROOT, "Data", "transform_type_code.cfg")
    print(json_url)
    data = json.load(open(json_url))
    print("type-code:", data)
    return jsonify(data)

@app.route('/get_tree', methods=['GET'])
def get_tree():
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT treearch FROM tree''')
    tree_data = cursor.fetchall()
    tree_structure = tree_data[0][0]
    return jsonify(tree_structure)

@app.route('/save_cata_txt', methods=['POST'])
def save_cata_txt():
    resp =[] 
    resp = request.json
    save_url = SITE_ROOT + "/SharedObjects/Sources/"
    f = open(save_url + resp['filename'] + '.txt', 'w+')
    f.write(resp['filecode'])
    f.close()
    # save type_object.json
    object_value = resp['filename']
    type_value = resp['usingtype']
    cat_name = "Cat A"
    code = resp['filecode']
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute("SELECT id FROM objects WHERE objectname=%s", object_value)
    print("--------+++++----------")
    print(cursor.rowcount)
    if cursor.rowcount == 0:
        # cursor.execute('''UPDATE objects SET objectname=%s, typename=%s, catename=%s, code=%s WHERE objectname=%s''', (object_value, type_value, cat_name, code, object_value))
    # else:
        cursor.execute('''INSERT INTO objects (objectname, typename, catename, code) VALUES (%s, %s, %s, %s)''', (object_value, type_value, cat_name, code))
    connect.commit()
    # tree
    cursor.execute('''SELECT JSON_EXTRACT(treearch, '$[0].children[0].children') FROM tree''')
    children_flag = cursor.fetchall()
    print("================")
    print(children_flag)
    cursor.execute('''SELECT JSON_CONTAINS(treearch, '{"icon": "static/images/object_icon.svg", "text": "''' + object_value + '''"}', '$[0].children[0].children') FROM tree''')
    exist_flag = cursor.fetchall()
    print(exist_flag)
    if children_flag[0][0] is not None:
        if exist_flag[0][0] != 1:
            cursor.execute('''UPDATE tree SET treearch = JSON_ARRAY_APPEND(treearch, '$[0].children[0].children', CAST('{"text" : "''' + object_value + '''","icon" : "static/images/object_icon.svg"}'  AS JSON))''')
            connect.commit()
            cursor.execute('''SELECT treearch FROM tree''')
            tree_data = cursor.fetchall()
            tree_structure = tree_data[0][0]
            return jsonify(tree_structure)
        else:
            return "exist"
    else:
        cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, '$[0].children[0].children', CAST('[{"text": "''' + object_value + '''","icon":"static/images/object_icon.svg"}]' AS JSON))''')
        connect.commit()
        cursor.execute('''SELECT treearch FROM tree''')
        tree_data = cursor.fetchall()
        tree_structure = tree_data[0][0]
        return jsonify(tree_structure)

@app.route('/save_cata_txt_for_edit', methods=["POST"])
def save_cata_txt_for_edit():
    resp =[]
    resp = request.json
    id = resp['edit_id']
    new_filename = resp['filename']
    typename = resp['usingtype']
    code = resp['filecode']
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute("SELECT * FROM objects WHERE id=%s", id)
    result = cursor.fetchall()
    old_filename = result[0][1]
    print("old filename: ", old_filename)
    cursor.execute("UPDATE objects SET objectname=%s, typename=%s, code=%s WHERE id=%s", (new_filename, typename, code, id))
    connect.commit()
    save_url = SITE_ROOT + "/SharedObjects/Sources/"
    if new_filename != old_filename:        
        cursor.execute('''SELECT JSON_SEARCH(treearch, 'one', %s) FROM tree''', old_filename)
        result_path = cursor.fetchone()
        print(result_path[0])
        # cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, '$[0].children[0].children', CAST('[{"text": "''' + new_filename + '''","icon":"static/images/object_icon.svg"}]' AS JSON))''')
        cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, ''' + result_path[0] + ''', "''' + new_filename + '''")''')
        connect.commit()
        os.rename(save_url + old_filename + ".txt", save_url + new_filename + ".txt") 
    f = open(save_url + new_filename + '.txt', 'w+')
    f.write(resp['filecode'])
    f.close()
    cursor.execute('''SELECT treearch FROM tree''')
    tree_data = cursor.fetchall()
    tree_structure = tree_data[0][0]
    return jsonify(tree_structure)

@app.route('/save_catb_txt', methods=['POST'])
def save_catb_txt():
    resp =[]
    resp = request.json
    save_url = SITE_ROOT + "/SharedObjects/Target/"
    f = open(save_url + resp['filename'] + '.txt', 'w+')
    f.write(resp['filecode'])
    f.close()
    # save type_object.json
    object_value = resp['filename']
    type_value = resp['usingtype']
    cat_name = "Cat B"
    code = resp['filecode']
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT id FROM objects WHERE objectname=%s''', object_value)
    print("--------+++++----------")
    if cursor.rowcount == 0:
        # cursor.execute('''UPDATE objects SET objectname=%s, typename=%s, catename=%s, code=%s WHERE objectname=%s''', (object_value, type_value, cat_name, code, object_value))
    # else:
        cursor.execute('''INSERT INTO objects (objectname, typename, catename, code) VALUES (%s, %s, %s, %s)''', (object_value, type_value, cat_name, code))
    connect.commit()
    # tree
    cursor.execute('''SELECT JSON_EXTRACT(treearch, '$[0].children[1].children') FROM tree''')
    children_flag = cursor.fetchall()
    print("================")
    print(children_flag)
    cursor.execute('''SELECT JSON_CONTAINS(treearch, '{"icon": "static/images/object_icon.svg", "text": "''' + object_value + '''"}', '$[0].children[1].children') FROM tree''')
    exist_flag = cursor.fetchall()
    print(exist_flag)
    if children_flag[0][0] is not None:
        if exist_flag[0][0] != 1:
            cursor.execute('''UPDATE tree SET treearch = JSON_ARRAY_APPEND(treearch, '$[0].children[1].children', CAST('{"text" : "''' + object_value + '''","icon" : "static/images/object_icon.svg"}'  AS JSON))''')
            connect.commit()
            cursor.execute('''SELECT treearch FROM tree''')
            tree_data = cursor.fetchall()
            tree_structure = tree_data[0][0]
            return jsonify(tree_structure)
        else:
            return "exist"
    else:
        cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, '$[0].children[1].children', CAST('[{"text": "''' + object_value + '''","icon":"static/images/object_icon.svg"}]' AS JSON))''')
        connect.commit()
        cursor.execute('''SELECT treearch FROM tree''')
        tree_data = cursor.fetchall()
        tree_structure = tree_data[0][0]
        return jsonify(tree_structure)

@app.route('/save_catb_txt_for_edit', methods=["POST"])
def save_catb_txt_for_edit():
    resp =[]
    resp = request.json
    id = resp['edit_id']
    new_filename = resp['filename']
    typename = resp['usingtype']
    code = resp['filecode']
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute("SELECT * FROM objects WHERE id=%s", id)
    result = cursor.fetchall()
    old_filename = result[0][1]
    print("old filename: ", old_filename)
    cursor.execute("UPDATE objects SET objectname=%s, typename=%s, code=%s WHERE id=%s", (new_filename, typename, code, id))
    connect.commit()
    save_url = SITE_ROOT + "/SharedObjects/Target/"
    if new_filename != old_filename:        
        cursor.execute('''SELECT JSON_SEARCH(treearch, 'one', %s) FROM tree''', old_filename)
        result_path = cursor.fetchone()
        print(result_path[0])
        # cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, '$[0].children[0].children', CAST('[{"text": "''' + new_filename + '''","icon":"static/images/object_icon.svg"}]' AS JSON))''')
        cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, ''' + result_path[0] + ''', "''' + new_filename + '''")''')
        connect.commit()
        os.rename(save_url + old_filename + ".txt", save_url + new_filename + ".txt") 
    f = open(save_url + new_filename + '.txt', 'w+')
    f.write(resp['filecode'])
    f.close()
    cursor.execute('''SELECT treearch FROM tree''')
    tree_data = cursor.fetchall()
    tree_structure = tree_data[0][0]
    return jsonify(tree_structure)
        
@app.route('/get_object', methods=['POST'])
def get_object():
    resp = []
    resp = request.json
    typename = resp['typename']
    codesetname = resp['codesetname']
    projectname = resp['projectname']
    connect = mysql.connect()
    cursor = connect.cursor()
    if typename == "t_sql":
        where_val = "Cat A"
        cursor.execute('''SELECT objectname FROM objects WHERE catename=%s''', where_val)
    elif typename == "t_expr":
        where_val = "Cat B"
        cursor.execute('''SELECT objectname FROM objects WHERE catename=%s''', where_val)
    else:
        cursor.execute('''SELECT name FROM catcs WHERE codesetname=%s AND projectname=%s''', (codesetname, projectname))
    object_data = cursor.fetchall()
    return jsonify(object_data)

@app.route('/save_codeset', methods=['POST'])
def save_codeset():
    resp = []
    resp = request.json
    codeset_txt_content = resp['codesetcontent']
    codeset_filename = resp['codesetname']
    project_name = resp['projectname']
    print(codeset_txt_content)
    print(project_name)
    print(codeset_filename)
    save_url = SITE_ROOT + '/Projects/' + project_name + '/'
    f = open(save_url + codeset_filename + '.txt', 'w+')
    f.writelines("%s\n" % line for line in codeset_txt_content)
    f.close()
    return "ok"

############################################################################
##                        API for tree                                    ##
############################################################################

@app.route('/add_object_ina', methods=['POST'])    
def add_object_ina():
    print("add_object-start")
    resp = []
    resp = request.json
    object_name = resp['objectname']
    print(object_name)
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT JSON_EXTRACT(treearch, '$[0].children[0].children') FROM tree''')
    children_flag = cursor.fetchall()
    print("================")
    print(children_flag)
    cursor.execute('''SELECT JSON_CONTAINS(treearch, '{"icon": "static/images/object_icon.svg", "text": "''' + object_name + '''"}', '$[0].children[0].children') FROM tree''')
    exist_flag = cursor.fetchall()
    print(exist_flag)
    if children_flag[0][0] is not None:
        if exist_flag[0][0] != 1:
            cursor.execute('''UPDATE tree SET treearch = JSON_ARRAY_APPEND(treearch, '$[0].children[0].children', CAST('{"text" : "''' + object_name + '''","icon" : "static/images/object_icon.svg"}'  AS JSON))''')
            connect.commit()
            cursor.execute('''SELECT treearch FROM tree''')
            tree_data = cursor.fetchall()
            tree_structure = tree_data[0][0]
            return jsonify(tree_structure)
        else:
            return "exist"
    else:
        cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, '$[0].children[0].children', CAST('[{"text": "''' + object_name + '''","icon":"static/images/object_icon.svg"}]' AS JSON))''')
        connect.commit()
        cursor.execute('''SELECT treearch FROM tree''')
        tree_data = cursor.fetchall()
        tree_structure = tree_data[0][0]
        return jsonify(tree_structure)
    
    
@app.route('/add_object_inb', methods=['POST'])
def add_object_inb():
    resp = []
    resp = request.json
    object_name = resp['objectname']
    print(object_name)
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT JSON_EXTRACT(treearch, '$[0].children[1].children') FROM tree''')
    children_flag = cursor.fetchall()
    print("================")
    print(children_flag)
    cursor.execute('''SELECT JSON_CONTAINS(treearch, '{"icon": "static/images/object_icon.svg", "text": "''' + object_name + '''"}', '$[0].children[1].children') FROM tree''')
    exist_flag = cursor.fetchall()
    print(exist_flag)
    if children_flag[0][0] is not None:
        if exist_flag[0][0] != 1:
            cursor.execute('''UPDATE tree SET treearch = JSON_ARRAY_APPEND(treearch, '$[0].children[1].children', CAST('{"text" : "''' + object_name + '''","icon" : "static/images/object_icon.svg"}'  AS JSON))''')
            connect.commit()
            cursor.execute('''SELECT treearch FROM tree''')
            tree_data = cursor.fetchall()
            tree_structure = tree_data[0][0]
            return jsonify(tree_structure)
        else:
            return "exist"
    else:
        cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, '$[0].children[1].children', CAST('[{"text": "''' + object_name + '''","icon":"static/images/object_icon.svg"}]' AS JSON))''')
        connect.commit()
        cursor.execute('''SELECT treearch FROM tree''')
        tree_data = cursor.fetchall()
        tree_structure = tree_data[0][0]
        return jsonify(tree_structure)

@app.route('/add_project', methods=['POST'])
def add_project():
    resp = []
    resp = request.json
    project_name = resp['projectname']
    print(project_name)
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT count(*) FROM projects''')
    emp_data = cursor.fetchone()
    print(emp_data[0])
    cursor.execute('''SELECT count(*) FROM projects WHERE projectname=%s''', project_name)
    count = cursor.fetchone()
    print(count[0])
    if (emp_data[0] == 0) or (count[0] == 0):
        cursor.execute('''INSERT INTO projects (projectname) VALUES(%s)''', project_name)
        connect.commit()
        cursor.execute('''SELECT JSON_EXTRACT(treearch, '$[1].children') FROM tree''')
        children_flag = cursor.fetchall()
        if children_flag[0][0] is not None:
            cursor.execute('''UPDATE tree SET treearch = JSON_ARRAY_APPEND(treearch, '$[1].children', CAST('{"text": "''' + project_name + '''","state":{"opened":true}}' AS JSON))''')
            connect.commit()
        else:
            cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, '$[1].children', CAST('[{"text": "''' + project_name + '''","state":{"opened":true}}]' AS JSON))''')
            connect.commit()
        os.makedirs(SITE_ROOT + "/Projects/" + project_name)
    else:
        return "exist"
    cursor.execute('''SELECT treearch FROM tree''')
    tree_data = cursor.fetchall()
    tree_structure = tree_data[0][0]
    return jsonify(tree_structure)

@app.route('/add_codeset', methods=['POST'])
def add_codeset():
    resp = []
    resp = request.json
    codeset_name = resp['codesetname']
    project_name = resp['projectname']
    print(codeset_name, project_name)
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT count(*) FROM codesets''')
    emp_data = cursor.fetchone()
    print(emp_data[0])
    cursor.execute('''SELECT count(*) FROM codesets WHERE codesetsname=%s''', codeset_name)
    count = cursor.fetchone()
    print(count[0])
    if (emp_data[0] == 0) or (count[0] == 0):
        cursor.execute('''INSERT INTO codesets (codesetsname, projectname) VALUES (%s, %s)''', (codeset_name,  project_name))
        connect.commit()
        cursor.execute('''SELECT JSON_SEARCH(treearch, 'one', %s) FROM tree''', project_name)
        result_path = cursor.fetchone()
        path = result_path[0][:-6]
        project_children_path = path[1:] + ".children"
        cursor.execute('''SELECT JSON_EXTRACT(treearch, %s) FROM tree''', project_children_path)
        children_flag = cursor.fetchall()
        print(children_flag)
        if children_flag[0][0] is not None:
            cursor.execute('''UPDATE tree SET treearch = JSON_ARRAY_APPEND(treearch, "''' + project_children_path + '''", CAST('{"text" : "''' + codeset_name + '''","icon" : "static/images/code_icon_cmd.svg"}'  AS JSON))''')
            connect.commit()
        else:
            cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, "''' + project_children_path + '''", CAST('[{"text" : "''' + codeset_name + '''","icon" : "static/images/code_icon_cmd.svg"}]'  AS JSON))''')
            connect.commit()
    else:
        return "exist"
    cursor.execute('''SELECT treearch FROM tree''')
    tree_data = cursor.fetchall()
    tree_structure = tree_data[0][0]
    return jsonify(tree_structure)

@app.route('/save_catcobject', methods=['POST'])
def save_catcobject():
    resp = []
    resp = request.json
    catcname = resp['catcname']
    catctype = resp['catctype']
    catctypename = resp['catctypename']
    catccode = resp['catccode']
    codesetsFilename = resp['codesetsFilename']
    projectFolder = resp['projectFolder']
    if isinstance(catctypename, list) == True:
        typename_str = ','.join(catctypename)
        print(typename_str)
    else:
        typename_str = catctypename
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''INSERT INTO catcs (codesetname, name, type, typename, code, projectname) VALUES (%s, %s, %s, %s, %s, %s)''', (codesetsFilename, catcname, catctype, typename_str, catccode, projectFolder))
    connect.commit()
    return "ok"

@app.route('/del_node', methods=['POST'])
def del_node():
    resp = []
    resp = request.json
    nodename = resp['nodename']
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT JSON_SEARCH(treearch, 'one', %s) FROM tree''', nodename)
    node_path = cursor.fetchone()
    path = node_path[0][:-6]
    path1 = path[1:]
    print(path1)
    cursor.execute('''SELECT JSON_REMOVE(treearch, %s) FROM tree''', path1)
    tree_data_rem = cursor.fetchall()
    tree_structure_rem = tree_data_rem[0][0]
    cursor.execute('''UPDATE tree SET treearch = %s''', tree_structure_rem)
    connect.commit()
    cursor.execute('''SELECT treearch FROM tree''')
    tree_data = cursor.fetchall()
    tree_structure = tree_data[0][0]
    # delete file and folder
    cursor.execute('''SELECT * FROM objects WHERE objectname=%s''', nodename)
    object_result = cursor.fetchone()
    print(object_result)
    cursor.execute('''SELECT * FROM catcs WHERE codesetname=%s''', nodename)
    codesets_result = cursor.fetchone()
    cursor.execute('''SELECT * FROM projects WHERE projectname=%s''', nodename)
    project_result = cursor.fetchone()
    if object_result is not None:
        cursor.execute('''DELETE FROM objects WHERE objectname=%s''', nodename)
        connect.commit()
        print("deleted object from database")
        if object_result[3] == "Cat A":
            object_url = SITE_ROOT + "/SharedObjects/Sources/" + nodename + ".txt"
            os.remove(object_url)
        elif object_result[3] == "Cat B":
            file_url = SITE_ROOT + "/SharedObjects/Target/"
            os.remove(file_url + nodename + ".txt")
    elif codesets_result is not None:
        cursor.execute('''DELETE FROM catcs WHERE codesetname=%s''', nodename)
        connect.commit()
        codesets_url = SITE_ROOT + "/Projects/" + codesets_result[6] + "/" + nodename + ".txt"
        os.remove(codesets_url)
        cursor.execute('''DELETE FROM codesets WHERE codesetsname=%s''', nodename)
        connect.commit()
    elif project_result is not None:
        cursor.execute('''DELETE FROM projects WHERE projectname=%s''', nodename)
        connect.commit()
        cursor.execute('''DELETE FROM catcs WHERE projectname=%s''', nodename)
        connect.commit()
        folder_url = SITE_ROOT + "/Projects/" + nodename
        shutil.rmtree(folder_url)
    return jsonify(tree_structure)

@app.route('/edit_object', methods=['POST'])
def edit_object():
    resp = []
    resp = request.json
    object_name = resp['objectname']
    parentid = resp['parentid']
    print(object_name)
    print(parentid)
    parent_num = parentid[3:]
    print(parent_num)
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT count(*) FROM objects''')
    object_counts = cursor.fetchone()
    print(object_counts[0])
    if int(parent_num) > object_counts[0] + 3:
        cursor.execute('''SELECT * FROM catcs WHERE codesetname=%s''', object_name)
        catc_results = cursor.fetchall()
        print(catc_results)
        return jsonify(catc_results, "Cat C")
        # cursor.execute('''SELECT * FROM codesetcontents WHERE codesetname=%s''', object_name)
        # codeset_results = cursor.fetchall()
        # print(codeset_results)
        # return jsonify(codeset_results, "Cat C")
    else:
        cursor.execute('''SELECT * FROM objects WHERE objectname=%s''', object_name)
        result = cursor.fetchall()
        print(result)
        return jsonify(result)

@app.route('/rename_project', methods=['POST'])
def rename_project():
    resp = []
    resp = request.json
    old_projectname = resp['old_projectname']
    new_projectname = resp['renamed_projectname']
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''UPDATE codesets SET projectname=%s WHERE projectname=%s''', (new_projectname, old_projectname))
    connect.commit()
    cursor.execute('''UPDATE projects SET projectname=%s WHERE projectname=%s''', (new_projectname, old_projectname))
    connect.commit()
    cursor.execute('''SELECT JSON_SEARCH(treearch, 'one', %s) FROM tree''', old_projectname)
    result_path = cursor.fetchone()
    print(result_path[0])
    cursor.execute('''UPDATE tree SET treearch = JSON_SET(treearch, ''' + result_path[0] + ''', "''' + new_projectname + '''")''')
    connect.commit()
    cursor.execute('''SELECT treearch FROM tree''')
    tree_data = cursor.fetchall()
    tree_structure = tree_data[0][0]
    return jsonify(tree_structure)

@app.route('/get_catcobj_for_edit', methods=['POST'])
def get_catcobj_for_edit():
    resp = []
    resp = request.json
    codesetname = resp['codeset_filename']
    objname = resp['objname']
    print(codesetname)
    print(objname)
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''SELECT * FROM catcs WHERE codesetname=%s AND name=%s''', (codesetname, objname))
    result = cursor.fetchone()
    print(result)
    if result[3] == "t_sql":
        cursor.execute('''SELECT objectname FROM objects WHERE catename=%s''', "Cat A")
    elif result[3] == "t_expr":
        cursor.execute('''SELECT objectname FROM objects WHERE catename=%s''', "Cat B")
    else:
        cursor.execute('''SELECT name FROM catcs''')
    objname_result = cursor.fetchall()
    return jsonify(result, objname_result)

@app.route('/update_codeset_for_edit', methods=['POST'])
def update_codeset_for_edit():
    resp = []
    resp = request.json
    print(resp)
    codeset_id = resp['codeset_id']
    catcname = resp['catcname']
    catctype = resp['catctype']
    catctypename = resp['catctypename']
    print(catcname)
    print(catctype)
    print(catctypename)
    print(codeset_id)
    if isinstance(catctypename[0], list) == True:
        typename_str = ','.join(catctypename[0])
    print(typename_str)
    catccode = resp['catccode']
    print(catccode) 
    connect = mysql.connect()
    cursor = connect.cursor()
    cursor.execute('''UPDATE catcs SET name=%s, type=%s, typename=%s, code=%s WHERE id=%s''', (catcname, catctype, typename_str, catccode, codeset_id))
    connect.commit()
    cursor.execute('''SELECT codesetname, projectname FROM catcs WHERE id=%s''', codeset_id)
    data = cursor.fetchone()
    codesetname = data[0]
    projectname = data[1]
    cursor.execute('''SELECT * FROM catcs WHERE codesetname=%s AND projectname=%s''', (codesetname, projectname))
    result = cursor.fetchall()
    return jsonify(result, projectname)

if __name__ == '__main__':
    app.run(debug=True)
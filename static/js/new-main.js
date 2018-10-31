var sources_type_code_json = 'http://127.0.0.1:5000/get_sources_type_code_cfg';
var target_type_code_json = 'http://127.0.0.1:5000/get_target_type_code_cfg';
var transform_type_code_json = 'http://127.0.0.1:5000/get_transform_type_code_cfg';

var jsondata_sources = $.getJSON(sources_type_code_json, function(result) {
    //console.log(result);
});

var jsondata_target = $.getJSON(target_type_code_json, function(result) {
    //console.log(result);
});

var jsondata_transform = $.getJSON(transform_type_code_json, function(result) {
    //console.log(result);
});

var edit_mode;
var edit_id;
var after_edit_codesets_projectname;

var catc_name = [];
var catc_type = [];
var catc_typename = [];
var catc_code=[];


$("#type-select-a").change(function(){
    var type_value = $(this).val();
    var a  = jsondata_sources.responseJSON;
    console.log(a);
    if(type_value == "0"){
        $("#code-textarea-a").val("");
    }
    else{
        var b = a.filter(c => c.typename === type_value);
        $("#code-textarea-a").val(b[0].code);
    }
});

$("#type-select-b").change(function(){
    var type_value = $(this).val();
    var a  = jsondata_target.responseJSON;
    if(type_value == "0"){
        $("#code-textarea-b").val("");
    }
    else{
        var b = a.filter(c => c.typename === type_value);
        $("#code-textarea-b").val(b[0].code);
    }
});

function cata_txt(){
    $("#suresaveModal").modal('hide');   
    var txt_name = $("#cata-text").val();
    var type =  $("#type-select-a").val();
    var txt_code = $("#code-textarea-a").val();
    data =  {
        'filename': txt_name,
        'usingtype': type,
        'filecode': txt_code,
        'edit_id': edit_id
    }
    console.log(txt_name, txt_code);
    console.log(edit_mode);
    console.log(edit_id);
    if(edit_mode == "editmode"){
        $.ajax({
            type: 'post',
            url: '/save_cata_txt_for_edit',
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify(data, null, '\t'),
            success: function(res){
                console.log("gotoedit");
                console.log(res);
                $("#successModal").modal('show');
                tree_structure = JSON.parse(res);
                $('#navigator').jstree(true).settings.core.data = tree_structure;
                $('#navigator').jstree(true).refresh();
            },
            error:function(error){
                console.log(error);
                alert("Sorry ! Faild to save file.")
            }
        });
    }
    else{
        $.ajax({
            type: 'post',
            url: '/save_cata_txt',
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify(data, null, '\t'),
            success: function(res){
                console.log("ttt");
                console.log(res);
                if (res == "exist"){
                    $("#existModal").modal('show');
                    $("#cata-text").val("");
                    $("#type-select-a").val("");
                    $("#code-textarea-a").val("");
                    $("#cata-text").focus();
                }
                else{
                    $("#successModal").modal('show');
                    tree_structure = JSON.parse(res);
                    $('#navigator').jstree(true).settings.core.data = tree_structure;
                    $('#navigator').jstree(true).refresh();
                }
            },
            error:function(error){
                console.log(error);
                alert("Sorry ! Faild to save file.")
            }
        });
    }  
}

function catb_txt(){
    $("#suresaveModal-b").modal('hide');   
    var txt_name = $("#catb-text").val();
    var type =  $("#type-select-b").val();
    var txt_code = $("#code-textarea-b").val();
    data =  {
        'filename': txt_name,
        'usingtype': type,
        'filecode': txt_code,
        'edit_id': edit_id
    }
    console.log(txt_name, txt_code);
    if(edit_mode == "editmode"){
        $.ajax({
            type: 'post',
            url: '/save_catb_txt_for_edit',
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify(data, null, '\t'),
            success: function(res){
                console.log("gotoedit");
                console.log(res);
                $("#successModal-b").modal('show');
                tree_structure = JSON.parse(res);
                $('#navigator').jstree(true).settings.core.data = tree_structure;
                $('#navigator').jstree(true).refresh();
            },
            error:function(error){
                console.log(error);
                alert("Sorry ! Faild to save file.")
            }
        });
    }
    else{
        $.ajax({
            type: 'post',
            url: '/save_catb_txt',
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify(data, null, '\t'),
            success: function(res){
                console.log(res);
                if (res == "exist"){
                    $("#existModal").modal('show');
                    $("#catb-text").val("");
                    $("#type-select-b").val("");
                    $("#code-textarea-b").val("");
                    $("#catb-text").focus();
                }
                else{
                    $("#successModal-b").modal('show');
                    tree_structure = JSON.parse(res);
                    $('#navigator').jstree(true).settings.core.data = tree_structure;
                    $('#navigator').jstree(true).refresh();
                }
            },
            error:function(error){
                console.log(error);
                alert("Sorry ! Faild to save file.")
            }
        });
    }
}

function catc_addcode(){
    $("#suresaveModal-c").modal('hide');
    var name_txt = $("#catc-text").val();
    var type_name = $("#type-select-c").val();
    var multi_name = $("#type-multi").val();
    var code_cont = $("#code-textarea-c").val();
    console.log("codesetsfilename:" + codeset_filename);
    console.log("projectFolder:" + selected_projectfolder);
    catc_name.push(name_txt);
    catc_type.push(type_name);
    catc_typename.push(multi_name);
    catc_code.push(code_cont);
    if (edit_mode === "editmode"){
        data = {
            'codeset_id': edit_id,
            'catcname': catc_name,
            'catctype': catc_type,
            'catctypename': catc_typename,
            'catccode': catc_code
        }
        $.ajax({
            type: 'post',
            url: '/update_codeset_for_edit',
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify(data, null, '\t'),
            success: function(res){
                console.log(res);
                after_edit_codesets_projectname = res[1];
                console.log(after_edit_codesets_projectname);
                $("#code-ul").empty();
                for (let a_catcobj of res[0]){
                    var append_li = "<li class='code-li'><a href='#' onclick='catcobj_edit(event)' class='badge badge-light catcobj-edit'><i class='fa fa-pencil'></i></a>"+ a_catcobj[2] + " " +"="+ " " + a_catcobj[3] + " " + "+"+ " " + a_catcobj[4] + " " +"+"+ " " + a_catcobj[5] +"</li>";
                    $("#code-ul").append(append_li);
                }
                edit_mode = "";
                catc_name = [];
                catc_type = [];
                catc_typename = [];
                catc_code = [];
            }
        });
    }
    else{
        data = {
            'catcname': name_txt,
            'catctype': type_name,
            'catctypename': multi_name,
            'catccode': code_cont,
            'codesetsFilename': codeset_filename,
            'projectFolder': selected_projectfolder
        }
        $.ajax({
            type: 'post',
            url: '/save_catcobject',
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify(data, null, '\t'),
            success: function(res){
                console.log(res);
                if (res == "ok"){
                    var append_li = "<li class='code-li'>"+ name_txt + " " +"="+ " " + type_name + " " + "+"+ " " + multi_name + " " +"+"+ " " + code_cont +"</li>";
                    $("#code-ul").append(append_li);
                }
            }
        });
    }
}

$("#type-select-c").change(function(){
    var type_name = $(this).val();
    console.log(type_name);
    console.log(codeset_filename);
    console.log(selected_projectfolder);
    data = {
        'typename': type_name,
        'codesetname': codeset_filename,
        'projectname': selected_projectfolder
    }
    $.ajax({
        type: 'post',
        url: '/get_object',
        contentType: 'application/json;charset=UTF-8',
        data:JSON.stringify(data, null, '\t'),
        success: function(res){
            console.log(res);
            $("#type-multi").children('option').remove();
            for (let item of res) {
                $('<option value="' + item + '">'+ item +'</option>').appendTo($("#type-multi"));
            }
        }
    });
    var a  = jsondata_transform.responseJSON;
    if(type_name == "0"){
        $("#code-textarea-c").val("");
    }
    else{
        var b = a.filter(c => c.typename === type_name);
        $("#code-textarea-c").val(b[0].code);
    }
});

function codeset_txt(){
    $("#codesetModal").modal('hide');
    var codeset_val = [];
    $(".code-li").each(function(i){
        console.log($(this).text());
        codeset_val.push($(this).text());
    });
    console.log(codeset_filename);
    console.log(codeset_val);
    console.log(selected_projectfolder);
    // if (edit_projectfolder == ""){
    //     data = {
    //         'codeset_filename': codeset_filename,
    //         'codeset_cont': codeset_val,
    //         'projectname': selected_projectfolder,
    //         'catcname': catc_name,
    //         'catctype': catc_type,
    //         'catctypename': catc_typename,
    //         'catccode': catc_code
            
    //     }
    // }
    // else {
    //     data = {
    //         'codeset_filename': codeset_filename,
    //         'codeset_cont': codeset_val,
    //         'projectname': edit_projectfolder,
    //         'catcname': catc_name,
    //         'catctype': catc_type,
    //         'catctypename': catc_typename,
    //         'catccode': catc_code
    //     }
    // }

    data = {
        'codesetname': codeset_filename,
        'codesetcontent': codeset_val,
        'projectname': selected_projectfolder
    }
        
    $.ajax({
        type: 'post',
        url: '/save_codeset',
        contentType: 'application/json;charset=UTF-8',
        data:JSON.stringify(data, null, '\t'),
        success: function(res){
            console.log(res);
            if (res == "ok"){
                $("#codeset-successModal").modal('show');
            }
            // $("#code-ul").empty();
            // $("#catc-text").val("");
            // $("#type-select-c").val("");
            // $("#type-multi").empty();
            // $("#code-textarea-c").val("");
        },
        error:function(error){
            console.log(error);
        }
    });
    
}

function catcobj_edit(event){
    console.log(event.path[2].innerText);
    var li_text = event.path[2].innerText;
    var li_text_array = li_text.split(" = ");
    console.log(li_text_array);
    console.log(codeset_filename);
    edit_mode = "editmode";
    data = {
        'codeset_filename': codeset_filename,
        'objname': li_text_array[0]
    }
    $.ajax({
        type: 'post',
        url: '/get_catcobj_for_edit',
        contentType: 'application/json;charset=UTF-8',
        data:JSON.stringify(data, null, '\t'),
        success: function(res){
            console.log(res);
            edit_id = res[0][0];
            console.log("edit_id:" + edit_id);
            $("#catc-text").val(res[0][2]);
            $("#type-select-c").val(res[0][3]);
            if ($('#type-multi option').length >= 1){
                $("#type-multi").empty();
            }
            var multi_val = res[0][4];
            for (let item of res[1]) {
                $('<option value="' + item + '">'+ item +'</option>').appendTo($("#type-multi"));
                // for (let val of multi_val){
                //     if (val == item){
                //         $('<option value="' + item + '" checked>'+ item +'</option>').appendTo($("#type-multi"));
                //     }
                //     $('<option value="' + item + '">'+ item +'</option>').appendTo($("#type-multi"));
                // }
            }
            $("#code-textarea-c").val(res[0][5]);
        }
    });
}

function delete_node() {
    $("#deleteModal").modal("hide");
    console.log('deleted');
    console.log(delete_data);
    console.log(delete_data.node.text);
    data = {
        'nodename': delete_data.node.text
    }
    $.ajax({
        type: 'post',
        url: '/del_node',
        contentType: 'application/json;charset=UTF-8',
        data:JSON.stringify(data, null, '\t'),
        success: function(res){
            tree_structure = JSON.parse(res);
            $('#navigator').jstree(true).settings.core.data = tree_structure;
            $('#navigator').jstree(true).refresh();
        }
    });
}

function delect_no() {
    $("#deleteModal").modal("hide");
    location.reload();
}

$("#cata_save_btn").click(function(){
    var objectname = $("#cata-text").val();
    $("#cata_name").text(objectname);
});

$("#catb_save_btn").click(function(){
    var objectname = $("#catb-text").val();
    $("#catb_name").text(objectname);
});

$("#codeset_save_btn").click(function(){
    $("#codeset_name").text(codeset_filename);
});
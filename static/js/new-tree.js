var tree_structure = [];
var codeset_filename;
var new_project_name;
var selected_projectfolder;
var edit_projectfolder = "";
var delete_data;

$( document ).ready(function() {
    // console.log( "ready!" );
    $.ajax({
        type: 'GET',
        url: '/get_tree',
        success: function(res){
            // console.log(res);
            tree_structure = JSON.parse(res);
            // console.log(tree_structure);
            tree_func(tree_structure);
        },
        error:function(error){
            console.log(error);
            alert("Sorry ! Faild to save file.")
        }
    });
});

function tree_func(tree_structure){
    var contextMenus = (node) => {
        console.log(node)
        if(node.parent == 'j1_1')
            var createLabel = 'Add Object';
        else if(node.parent == '#')
            var createLabel = 'Add Project';
        else if(node.parent != 'j1_1' && node.parents[1] == '#')
            var createLabel = 'rename Project';
        else
            var createLabel = 'Add CodeSet';
        selected_projectfolder = node.text;
        console.log(selected_projectfolder);
        if (createLabel == 'Add Object'){
            var menuObject = {
                "create": {
                    "label": createLabel,
                    "action": function (data) {
                        if (selected_projectfolder == 'Sources'){
                            console.log("Add object into Sources");
                            $("#working_now").empty();
                            if (!($("#tab-a").hasClass("active") && $("#tab-a").hasClass("show"))){
                                $("#tab-a").addClass("active show");
                                $("#tab-b").removeClass("active show");
                                $("#tab-c").removeClass("active show");
                                $("#cat-a").addClass("active show");
                                $("#cat-b").removeClass("active show");
                                $("#cat-c").removeClass("active show");
                            }
                            $("#cata-text").val("");
                            $("#type-select-a").val("");
                            $("#code-textarea-a").val("");
                            $("#cata-text").focus();
                        }
                        else{
                            console.log("Add object into Target");
                            $("#working_now").empty();
                            if (!($("#tab-b").hasClass("active") && $("#tab-b").hasClass("show"))){
                                $("#tab-b").addClass("active show");
                                $("#tab-a").removeClass("active show");
                                $("#tab-c").removeClass("active show");
                                $("#cat-b").addClass("active show");
                                $("#cat-a").removeClass("active show");
                                $("#cat-c").removeClass("active show");
                            }
                            $("#catb-text").val("");
                            $("#type-select-b").val("");
                            $("#code-textarea-b").val("");
                            $("#catb-text").focus();
                        }
                    }
                },
                // "edit": {
                //     "label": "Edit",
                //     "action": function (data) {
                //         var inst = $.jstree.reference(data.reference);
                //             obj = inst.get_node(data.reference);
                //             console.log(obj)
                //             edit();
                //     }
                // },
                // "delete": {
                //     "label": "Delete",
                //     "action": function (data) {
                //         var ref = $.jstree.reference(data.reference),
                //             sel = ref.get_selected();
                //         if(!sel.length) { return false; }
                //         ref.delete_node(sel);
                //     }
                // }           
            } 
        }
        else if (createLabel == 'Add Project'){
            var menuObject = {
                "create": {
                    "label": createLabel,
                    "action": function (data) {
                        console.log("Add project");
                        $("#working_now").empty();
                        var ref = $.jstree.reference(data.reference);
                            sel = ref.get_selected();
                        if(!sel.length) { return false; }
                        sel = sel[0];
                        sel = ref.create_node(sel, {"type":"file"});
                        if(sel) {
                            ref.edit(sel);
                        }
                    }
                }
            }
        }
        else if (createLabel == 'rename Project'){
            var menuObject = {
                "create": {
                    "label": "Add codesets",
                    "action": function (data) {
                        console.log("Add codesets");
                        var ref = $.jstree.reference(data.reference);
                            sel = ref.get_selected();
                        if(!sel.length) { return false; }
                        sel = sel[0];
                        sel = ref.create_node(sel, {"type":"file"});
                        if(sel) {
                            ref.edit(sel);
                        }
                    }
                },
                "rename": {
                    "label": "Rename",
                    "action": function (data) {
                        var inst = $.jstree.reference(data.reference);
                            obj = inst.get_node(data.reference);
                        inst.edit(obj);
                        console.log(obj);
                    }
                },
                "delete": {
                    "label": "Delete",
                    "action": function (data) {
                        var ref = $.jstree.reference(data.reference),
                            sel = ref.get_selected();
                        if(!sel.length) { return false; }
                        ref.delete_node(sel);
                    }
                }
            }
        }
        else{
            var menuObject = {
                "create": {
                    "label": createLabel,
                    "action": function (data) {
                        console.log("Add codesets");
                        var ref = $.jstree.reference(data.reference);
                            sel = ref.get_selected();
                        if(!sel.length) { return false; }
                        sel = sel[0];
                        sel = ref.create_node(sel, {"type":"file"});
                        if(sel) {
                            ref.edit(sel);
                        }
                    }
                },
                "edit": {
                    "label": "Edit",
                    "action": function (data) {
                        var inst = $.jstree.reference(data.reference);
                            obj = inst.get_node(data.reference);
                            console.log(obj)
                            edit();
                    }
                },
                "delete": {
                    "label": "Delete",
                    "action": function (data) {
                        var ref = $.jstree.reference(data.reference),
                            sel = ref.get_selected();
                        if(!sel.length) { return false; }
                        ref.delete_node(sel);
                    }
                }        
            }
        }
               
        if (node.parents.length === 3)
            delete menuObject.create;

        if (node.id==='j1_1') 
            menuObject = null;

        return menuObject;
    }

    $('#navigator').jstree({
        "core" : {
            "data" : tree_structure,
            "check_callback" : function (operation, node, parent, position, more) {
                if(operation === "copy_node" || operation === "move_node") {
                    if(parent.id === "#") {
                        return false; // prevent moving a child above or below the root
                    }
                }
                return true; // allow everything else
            }
        },
        "plugins" : ["contextmenu"],
        "contextmenu": {
            "items": contextMenus
        }
    });

    var $treeObject = $('#navigator');
    var is_new = false;
    
    $treeObject.on("changed.jstree", function (e, data) {
        is_new = false;
    });
    
    $treeObject.on("create_node.jstree", function (e, data) {
        is_new = true;
        console.log("b")
    });

    $treeObject.on("rename_node.jstree", function (e, data) {   
        if (is_new) {
            switch (data.node.parents.length) {
                case 2:
                    console.log('Add Project');
                    console.log(data);
                    new_project_name = data.text;
                    console.log(new_project_name);
                    $("#working_now").empty();
                    tree_data = {
                        'projectname': data.node.text
                    }
                    $.ajax({
                        type: 'post',
                        url: '/add_project',
                        contentType: 'application/json;charset=UTF-8',
                        data:JSON.stringify(tree_data, null, '\t'),
                        success: function(res){
                            console.log(res);
                            if(res == "exist"){
                                alert("Already exist project name.")
                                location. reload(true);
                            }
                            else{
                                tree_structure = JSON.parse(res);
                                $('#navigator').jstree(true).settings.core.data = tree_structure;
                                $('#navigator').jstree(true).refresh();
                            }
                        }
                    });
                    break;
                case 3:
                    if (data.node.parents[1] == 'j1_1') {
                        if (data.node.parents[0] == 'j1_2') {
                            console.log('Add Object A');
                            console.log(data.node.text);
                            $("#working_now").empty();
                            tree_data = {
                                'objectname': data.node.text
                            }
                            $.ajax({
                                type: 'post',
                                url: '/add_object_ina',
                                contentType: 'application/json;charset=UTF-8',
                                data:JSON.stringify(tree_data, null, '\t'),
                                success: function(res){
                                    console.log(res);
                                    if(res == "exist"){
                                        alert("Exist object name !");
                                        location. reload(true);
                                    }
                                    else{
                                        tree_structure = JSON.parse(res);
                                        $('#navigator').jstree(true).settings.core.data = tree_structure;
                                        $('#navigator').jstree(true).refresh();
                                        $("#cata-text").val(data.node.text);
                                        $("#type-select-a").val("");
                                        $("#code-textarea-a").val("");
                                    }
                                }
                            });
                        } else {
                            console.log('Add Object B');
                            $("#working_now").empty();
                            tree_data = {
                                'objectname': data.node.text
                            }
                            $.ajax({
                                type: 'post',
                                url: '/add_object_inb',
                                contentType: 'application/json;charset=UTF-8',
                                data:JSON.stringify(tree_data, null, '\t'),
                                success: function(res){
                                    console.log(res);
                                    if(res == "exist"){
                                        alert("Exist object name !");
                                        location. reload(true);
                                    }
                                    else{
                                        tree_structure = JSON.parse(res);
                                        // tree_func(tree_structure);
                                        // tree_structure = res
                                        // location. reload(true);
                                        $('#navigator').jstree(true).settings.core.data = tree_structure;
                                        $('#navigator').jstree(true).refresh();
                                        $("#catb-text").val(data.node.text);
                                        $("#type-select-b").val("");
                                        $("#code-textarea-b").val("");
                                    }
                                }
                            });
                        }
                    } else {
                        console.log('Add CodeSet');
                        console.log("data:" + data);
                        console.log(selected_projectfolder);
                        console.log("codesets_name:" + data.node.text);
                        $("#working_now").text(data.node.text);
                        $("#code-ul").empty();
                        $("#catc-text").val("");
                        $("#type-select-c").val("");
                        $("#type-multi").empty();
                        $("#code-textarea-c").val("");
                        // catc_name = [];
                        // catc_type = [];
                        // catc_typename = [];
                        // catc_code=[];
                        tree_data = {
                            'codesetname': data.node.text,
                            'projectname': selected_projectfolder
                        }
                        codeset_filename = data.node.text;
                        $.ajax({
                            type: 'post',
                            url: '/add_codeset',
                            contentType: 'application/json;charset=UTF-8',
                            data:JSON.stringify(tree_data, null, '\t'),
                            success: function(res){
                                console.log(res);
                                if(res == "exist"){
                                    alert("Exist object name !");
                                    location. reload(true);
                                }
                                else{
                                    tree_structure = JSON.parse(res);
                                    $('#navigator').jstree(true).settings.core.data = tree_structure;
                                    $('#navigator').jstree(true).refresh();
                                    // 
                                    console.log("Add object into Category C");
                                    if (!($("#tab-c").hasClass("active") && $("#tab-c").hasClass("show"))){
                                        $("#tab-c").addClass("active show");
                                        $("#tab-a").removeClass("active show");
                                        $("#tab-b").removeClass("active show");
                                        $("#cat-c").addClass("active show");
                                        $("#cat-a").removeClass("active show");
                                        $("#cat-b").removeClass("active show");
                                    }
                                    $("#catc-text").val("");
                                    $("#type-select-c").val("");
                                    $("code-ul").empty();
                                    $("#code-textarea-c").val("");
                                    $("#catc-text").focus();
                                }
                            }
                        });
                    }
                    break;
            }
        }
        else {
            console.log('rename', data.text);
            console.log('oldProjectname', selected_projectfolder);
            var renamed_projectname = data.text;
            data = {
                'old_projectname': selected_projectfolder,
                'renamed_projectname': renamed_projectname
            }
            $.ajax({
                type: 'post',
                url: '/rename_project',
                contentType: 'application/json;charset=UTF-8',
                data:JSON.stringify(data, null, '\t'),
                success: function(res){
                    console.log(res);
                    tree_structure = JSON.parse(res);
                    $('#navigator').jstree(true).settings.core.data = tree_structure;
                    $('#navigator').jstree(true).refresh();
                }
            });
        }
    });

    var edit = () => {
        console.log("Edit");
        console.log(obj);
        data = {
            'objectname': obj.text,
            'parentid': obj.parent
        }
        edit_mode = "editmode";
        $.ajax({
            type: 'post',
            url: '/edit_object',
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify(data, null, '\t'),
            success: function(res){
                console.log(res);
                if(res[0][3] == "Cat A"){
                    $("#working_now").empty();
                    edit_id = res[0][0];
                    $("#cata-text").val(res[0][1]);
                    $("#type-select-a").val(res[0][2]);
                    $("#code-textarea-a").val(res[0][4]);
                }
                else{
                    $("#working_now").empty();
                    edit_id = res[0][0];
                    $("#catb-text").val(res[0][1]);
                    $("#type-select-b").val(res[0][2]);
                    $("#code-textarea-b").val(res[0][4]);
                }
                if(res[1] == "Cat C"){
                    codeset_filename = obj.text;
                    console.log(codeset_filename);
                    edit_projectfolder = res[0][0][6];
                    console.log("edit_projectfolder:" + edit_projectfolder);
                    selected_projectfolder = edit_projectfolder;
                    $("#working_now").text(codeset_filename);
                    if ($('#code-ul li').length >= 1){
                        $("#code-ul").empty();
                    }
                    for (let a_catcobj of res[0]){
                        var append_li = "<li class='code-li'><a href='#' onclick='catcobj_edit(event)' class='badge badge-light catcobj-edit'><i class='fa fa-pencil'></i></a>"+ a_catcobj[2] + " " +"="+ " " + a_catcobj[3] + " " + "+"+ " " + a_catcobj[4] + " " +"+"+ " " + a_catcobj[5] +"</li>";
                        $("#code-ul").append(append_li);
                    }
                }
            }
        });
    }

    // Delete
    $treeObject.on("delete_node.jstree", function (e, data) {
        // var really = confirm("Are you sure?");
        // if (really == true){
        //     console.log('deleted');
        //     console.log(data);
        //     console.log(data.node.text);
        //     data = {
        //         'nodename': data.node.text
        //     }
        //     $.ajax({
        //         type: 'post',
        //         url: '/del_node',
        //         contentType: 'application/json;charset=UTF-8',
        //         data:JSON.stringify(data, null, '\t'),
        //         success: function(res){
        //             tree_structure = JSON.parse(res);
        //             $('#navigator').jstree(true).settings.core.data = tree_structure;
        //             $('#navigator').jstree(true).refresh();
        //         }
        //     });
        // }
        // else {
        //     $('#navigator').jstree(true).settings.core.data = tree_structure;
        //     $('#navigator').jstree(true).refresh();
        // }
        $("#deleteModal").modal("show");
        delete_data = data;
    });

    // var rename = () =>{
    //     console.log("Rename");
    //     // console.log(data);
    //     data = {
    //         'objectname': obj.text
    //     }
    //     // $.ajax({
    //     //     type: 'post',
    //     //     url: '/rename_project',
    //     //     contentType: 'application/json;charset=UTF-8',
    //     //     data:JSON.stringify(data, null, '\t'),
    //     //     success: function(res){
    //     //         console.log(res);
    //     //         tree_structure = JSON.parse(res);
    //     //         $('#navigator').jstree(true).settings.core.data = tree_structure;
    //     //         $('#navigator').jstree(true).refresh();
    //     //     }
    //     // });
    // }
}
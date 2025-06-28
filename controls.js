/*
js file for controls and eventlisteners
 */


//Adding Event listeners to inputs

//for showing new bill generation page
document.getElementById("new_bill_btn").addEventListener("click", () => { show_page("new_bill_page") });

//closing bill creation page
document.getElementById("close_new_bill_btn").addEventListener("click", () => { show_page("bill_page"); clear_new_bill_page(); });

//closing bill view page
document.getElementById("close_bill_view_btn").addEventListener("click", () => { show_page("bill_page") });

//eventlistener for options in bill table
document.getElementById("info_table").addEventListener("click", check_info_table_options);

//eventlisteners for options in expense record table
document.getElementById("expense_record_table").addEventListener("click", check_record_table_options);

//showing bill delete confirmation dialogue
document.getElementById("bill_delete_confirm").addEventListener("click", delete_bill);
//closing bill confirmation dialogue
document.getElementById("bill_delete_cancel").addEventListener("click", close_delete_modal);


/*
For increasing and decresing no. of members on bill generation page
*/
document.getElementById("total_members_decrease").onclick = () => {
    let total_member = document.getElementById("bill_total_members");
    if (total_member.valueAsNumber > 2) {
        total_member.value = total_member.valueAsNumber - 1;
        document.getElementById("bill_members_inputs").firstElementChild.lastElementChild.remove();
    } else {
        total_member.value = "2";
    }
}
document.getElementById("total_members_increase").onclick = () => {
    let total_member = document.getElementById("bill_total_members");
    if (total_member.valueAsNumber < 50) {
        total_member.value = total_member.valueAsNumber + 1;
        const li = document.createElement("li");
        const input = document.createElement("input");
        input.type = "text";
        const text = document.createTextNode(`Member ${total_member.valueAsNumber} `);
        li.append(text, input)
        document.getElementById("bill_members_inputs").firstElementChild.appendChild(li);
    } else {
        total_member.value = "50";
    }
}


//Eventlistener for new bill generation button
document.getElementById("new_bill_view_btn").onclick = () => {
    const input_exp = /[^a-zA-Z0-9_ ]| (?= )/g;
    const bill_name = document.getElementById("new_bill_name").value.trim().toUpperCase();
    const name_inputs = document.getElementById("bill_members_inputs").getElementsByTagName("input");
    let inputs_filled = true;
    const member_names = []
    for (let i = 0; i < name_inputs.length; i++) {
        member_names.push(name_inputs[i].value.replaceAll(input_exp, "").trim().toUpperCase());
    }

    for (let i = 0; i < name_inputs.length; i++) {
        if (name_inputs[i].value.replaceAll(input_exp, "").trim() == "") {
            inputs_filled = false;
            break;
        }
    }
    const has_duplicate_names = (new Set(member_names)).size !== member_names.length;

    if (bill_name == "") {
        document.getElementById("new_bill_error").innerText = "Bill name is Empty! or Invalid";

    } else if (check_name_exists("info_table", bill_name)) {
        document.getElementById("new_bill_error").innerText = "Bill name already Exists!";

    } else if (!inputs_filled) {
        document.getElementById("new_bill_error").innerText = "Member name is Empty! or Invalid";

    } else if (has_duplicate_names) {
        document.getElementById("new_bill_error").innerText = "Members name can't Same!";
    } else {
        generate_new_bill(bill_name, member_names);
        clear_new_bill_page();
    }

}


////Eventlistener for new expense generation button
document.getElementById("new_expense_btn").onclick = () => {
    //const input_exp = /[^a-zA-Z0-9_ ]| (?= )/g;
    const input_exp = "";
    const bill_name = document.getElementById("bill_view_name").innerText;
    const record_name = document.getElementById("bill_record_name").value.replaceAll(input_exp, "").trim().toUpperCase();
    const paid_amt_inputs = document.getElementById("bill_paid_by").getElementsByTagName("input");
    const share_by_inputs = document.getElementById("bill_shared_by").getElementsByTagName("input");
    const error_el = document.getElementById("new_expense_error");
    let total_amount = 0;
    let total_shared_by = 0;
    const paid_amounts = [];
    const shared_by = [];
    for (let i = 0; i < paid_amt_inputs.length; i++) {
        if (paid_amt_inputs[i].value == "") {
            paid_amt_inputs[i].value = "0";
        }
        total_amount += Math.floor(paid_amt_inputs[i].valueAsNumber);
        if (share_by_inputs[i].checked == true) {
            total_shared_by++;
        }
        paid_amounts.push(Math.floor(paid_amt_inputs[i].valueAsNumber));
        shared_by.push(share_by_inputs[i].checked);
    }

    if (record_name == "") {
        error_el.innerText = "Expense name is empty! or Invalid";

    } else if (check_name_exists("expense_record_table", record_name)) {
        error_el.innerText = "Expense name alreay exists!";
    } else {

        if (total_amount == 0) {
            error_el.innerText = "No one has paid ?";
        } else if (total_shared_by == 0) {
            error_el.innerText = "No one has shared ?";
        } else {
            add_new_record(bill_name, record_name, paid_amounts, shared_by);
            error_el.innerText = "";
        }
    }

}

//for checking if bill name or expense name already exists from the table
function check_name_exists(table_id, name) {
    const rows = document.getElementById(table_id).getElementsByTagName("tr");
    let exists = false;
    for (let i = 1; i < rows.length; i++) {
        if (rows[i].firstChild.innerText == name) {
            exists = true;
        }
    }
    return exists;
}

//checking the clicked option in bill table
function check_info_table_options(e) {
    if (e.target.classList.contains("view-btn")) {
        show_page("bill_view_page");
        const bill_name = e.target.dataset.bill_name;
        update_bill_expense_page(bill_name);
    } else if (e.target.classList.contains("del-btn")) {
        const bill_name = e.target.dataset.bill_name;
        document.getElementById("delete_modal").style.display = "block";
        document.getElementById("bill_delete_confirm").dataset.bill_name = bill_name;
    }
}

//checking the clicked option in expense table
function check_record_table_options(e) {
    if (e.target.classList.contains("del-btn")) {
        show_page("bill_view_page");
        const bill_name = document.getElementById("bill_view_name").innerText;
        const record_name = e.target.dataset.record_name;
        delete_record(bill_name, record_name);
        update_bill_expense_page(bill_name);
    }
}

//for toogling pages(bill_page, new_bill_page, bill_view_page)
function show_page(id) {
    const pages = document.getElementsByClassName("page");
    for (let i = 0; i < pages.length; i++) {
        pages[i].style.display = "none";
    }
    document.getElementById(id).style.display = "block";
}


//Clearing bill generaton page inputs
function clear_new_bill_page() {
    document.getElementById("new_bill_name").value = "";
    document.getElementById("bill_total_members").value = 2;
    document.getElementById("new_bill_error").innerText = "";
    document.getElementById("bill_members_inputs").innerHTML = `<ul><li>Member 1 <input type="text"></li><li>Member 2 <input type="text"></li></ul>`;
}

//closing delete confirm modal
function close_delete_modal() {
    document.getElementById("bill_delete_confirm").dataset.bill_name = "";
    document.getElementById("delete_modal").style.display = "none";
}

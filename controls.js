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
document.getElementById("bill_container").addEventListener("click", check_bill_container_options);

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
        document.getElementById("bill_members_inputs").lastElementChild.remove();
    } else {
        total_member.value = "2";
        showToast("Minimum 2 members required!", "error");
    }
}
document.getElementById("total_members_increase").onclick = () => {
    let total_member = document.getElementById("bill_total_members");
    if (total_member.valueAsNumber < 50) {
        total_member.value = total_member.valueAsNumber + 1;
        const input_wrapper = document.createElement("div");
        input_wrapper.classList.add("text-input-wrapper");
        const input = document.createElement("input");
        const label = document.createElement("label");
        input.type = "text";
        const text = document.createTextNode(`Member ${total_member.valueAsNumber} `);
        label.append(text);
        input_wrapper.append(label, input);
        document.getElementById("bill_members_inputs").appendChild(input_wrapper);
    } else {
        total_member.value = "50";
        showToast("Maximum can be 50 members!", "error");
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
        showToast("Bill name is Empty! or Invalid", "error");


    } else if (check_bill_exists("bill_container", bill_name)) {
        showToast("Bill name already Exists!", "error");
    } else if (!inputs_filled) {
        showToast("Member name is Empty! or Invalid", "error");

    } else if (has_duplicate_names) {
        showToast("Members name can't Same!", "error");
    } else {
        generate_new_bill(bill_name, member_names);
        clear_new_bill_page();
        //showToast("New Bill Added");
    }

}


////Eventlistener for new expense generation button
document.getElementById("new_expense_btn").onclick = () => {
    //const input_exp = /[^a-zA-Z0-9_ ]| (?= )/g;
    const input_exp = "";
    const bill_name = document.getElementById("bill_view_name").innerText;
    const record_name = document.getElementById("bill_record_name").value.replaceAll(input_exp, "").trim().toUpperCase();
    const paid_amt_inputs = document.getElementById("bill_paid_by").getElementsByTagName("input");
    const equally_shared = document.getElementById("equally-shared").checked;
    const equally_share_by_inputs = document.getElementById("equally_shared_by").getElementsByTagName("input");
    const unequal_share_by_inputs = document.getElementById("unequal_shared_by").getElementsByTagName("input");
    const total_members = paid_amt_inputs.length;

    let total_paid_amount = 0;   // Stored in cents
    let total_spent_amount = 0;  // Stored in cents
    let total_shared_by = 0;
    const paid_amounts = [];     // Stored in cents
    const spent_amounts = [];    // Stored in cents

    for (let i = 0; i < total_members; i++) {
        if (paid_amt_inputs[i].value == "") {
            paid_amt_inputs[i].value = "0";
        }
        if (unequal_share_by_inputs[i].value == "") {
            unequal_share_by_inputs[i].value = "0"; // Kept as string consistency
        }

        // Convert input dollars to clean integer cents using Math.round
        const current_paid_cents = Math.round((paid_amt_inputs[i].valueAsNumber || 0) * 100);
        const current_unequal_cents = Math.round((unequal_share_by_inputs[i].valueAsNumber || 0) * 100);

        total_paid_amount += current_paid_cents;

        if (equally_shared) {
            if (equally_share_by_inputs[i].checked) {
                total_shared_by++;
            }
            total_spent_amount += current_paid_cents;
        } else {
            total_spent_amount += current_unequal_cents;
        }
        paid_amounts.push(current_paid_cents);
    }

    if (equally_shared) {
        const divisor = total_shared_by || 1;
        // Use Math.floor to get the base cents
        const spent_by_each = Math.floor(total_paid_amount / divisor);

        // Give everyone the base amount
        for (let i = 0; i < total_members; i++) {
            if (equally_share_by_inputs[i].checked) {
                spent_amounts.push(spent_by_each);
            } else {
                spent_amounts.push(0);
            }
        }

        // Calculate the exact remainder
        let leftover_pennies = total_paid_amount % divisor;

        // Find who paid to use as a starting index
        let payer_index = paid_amounts.findIndex(amt => amt > 0);
        if (payer_index === -1) payer_index = 0;

        //Distribute the leftovers perfectly among the people sharing
        let current_index = payer_index;
        while (leftover_pennies > 0) {
            if (equally_share_by_inputs[current_index].checked) {
                spent_amounts[current_index] += 1; // Add exactly 1 penny
                leftover_pennies--;
            }
            current_index = (current_index + 1) % total_members;
        }

        // This guarantees that Sum(spent_amounts) is EXACTLY EQUAL to total_paid_amount
        total_spent_amount = total_paid_amount;
    }else {
        for (let i = 0; i < total_members; i++) {
            const current_unequal_cents = Math.round((unequal_share_by_inputs[i].valueAsNumber || 0) * 100);
            spent_amounts.push(current_unequal_cents);
        }
    }


    if (record_name == "") {
        showToast("Expense name is empty! or Invalid", "error");
    } else if (check_record_exists("expense_record_table", record_name)) {
        showToast("Expense name alreay exists!", "error");
    } else if (total_paid_amount !== total_spent_amount) {
        const amt_exceed = (total_paid_amount/10)-(total_spent_amount/10);
        if(amt_exceed>0){
            showToast(`Total Spent amount is ${localFormatter.format(amt_exceed)} less than paid`, "error");
        }else{
            showToast(`Total Spent amount is ${localFormatter.format(-amt_exceed)} more than paid`, "error");
        }

    } else {

        if (total_paid_amount == 0) {
            showToast("No one has paid ?", "error");
        } else if (total_shared_by == 0 && equally_shared) {
            showToast("No one has shared ?", "error");
        } else {
            add_new_record(bill_name, record_name, paid_amounts, spent_amounts,total_paid_amount);
            //showToast("New record added")
        }
    }

}

function check_bill_exists(container_id, name) {
    const rows = document.getElementById(container_id).getElementsByClassName("bill-title");
    //console.log(rows)
    let exists = false;
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].innerText == name) {
            exists = true;

        }
    }
    return exists;
}
//for checking if bill name or expense name already exists from the table
function check_record_exists(table_id, name) {
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
function check_bill_container_options(e) {
    if (e.target.classList.contains("view-btn")) {
        show_page("bill_view_page");
        const bill_name = e.target.dataset.billName;
        update_bill_expense_page(bill_name);
    } else if (e.target.classList.contains("del-btn")) {
        const bill_name = e.target.dataset.billName;
        document.getElementById("delete_modal").style.display = "flex";
        document.getElementById("bill_delete_confirm").dataset.billName = bill_name;
    }else if(e.target.classList.contains("download-btn")){
        const bill_card_id = e.target.dataset.billCardId;
        const bill_name = e.target.dataset.billName;
        downloadBillImage(bill_card_id,bill_name);
    }else if(e.target.classList.contains("whatsapp-btn")){
        const bill_card_id = e.target.dataset.billCardId;
        const bill_name = e.target.dataset.billName;
        shareBillToWhatsApp(bill_card_id,bill_name);
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
    document.getElementById(id).style.display = "grid";
}


//Clearing bill generaton page inputs
function clear_new_bill_page() {
    document.getElementById("new_bill_name").value = "";
    document.getElementById("bill_total_members").value = 2;
    document.getElementById("bill_members_inputs").innerHTML = `<div class="text-input-wrapper"><label>Member 1</label><input type="text"></div><div class="text-input-wrapper"><label>Member 2</label><input type="text"></div>`;
}

//closing delete confirm modal
function close_delete_modal() {
    document.getElementById("bill_delete_confirm").dataset.billName = "";
    document.getElementById("delete_modal").style.display = "none";
}


function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500); // Wait for fade-out animation
    }, 4000);
}

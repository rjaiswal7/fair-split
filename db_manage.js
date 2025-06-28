/*
js file for managing database
*/
let db;
//saving store details in a object
const store_list = [
    {
        name: "bill_members",
        indexes: [
            { index_name: "bill_name", unique: false }
        ]
    },
    {
        name: "bill_record",
        indexes: [
            { index_name: "bill_name", unique: false }
        ]
    },
    {
        name: "bill_info",
        indexes: [
            { index_name: "bill_name", unique: true }
        ]
    }
]

function init_database() {
    //opening database
    const db_request = indexedDB.open("bill_splitter");
    db_request.onsuccess = () => {
        console.log("Database Opened!");
        db = db_request.result;//assigning database to db variable for future uses
        update_info_table();//Refreshing bill table
    }

    db_request.onerror = (event) => {
        console.log("Database Error: " + db_request.error);
    }
    //initialising upgrade or database for first time
    db_request.onupgradeneeded = (event) => {
        const up_db = event.target.result;
        console.log("Creating Stores....");

        //Creating multiple stores
        for (let i = 0; i < store_list.length; i++) {
            if (!up_db.objectStoreNames.contains(store_list[i].name)) {
                const store = up_db.createObjectStore(store_list[i].name, { keyPath: "id", autoIncrement: true });
                //Adding Indexes for store
                for (let j = 0; j < store_list[i].indexes.length; j++) {
                    const index_name = store_list[i].indexes[j].index_name;
                    const index_unique = store_list[i].indexes[j].unique
                    store.createIndex(index_name, index_name, { unique: index_unique })
                }
                add_example_bill(store, i)
                console.log(`${store_list[i].name} store added`);

            } else {
                console.log("store already exists");
            }
        }
    }
    db_request.onversionchange = () => {
        console.log("version change");
    }
}


//Initialising database creation
init_database();


//function for adding example bill for the first time
function add_example_bill(store, index) {
    const bill_name = "Goa Trip (Demo)";
    const bill_info = {
        bill_name: bill_name,
        summary: [['KARAN', 270, 'RAM'], ['KARAN', 670, 'SHYAM'], ['KARAN', 190, 'SHIVAY'], ['RAHUL', 1230, 'SHIVAY']]
    }
    const bill_members = [{ bill_name: bill_name, member_name: "RAM", paid: 2000, spent: 1730, balance: 270 },
    { bill_name: bill_name, member_name: "SHYAM", paid: 2400, spent: 1730, balance: 670 }, { bill_name: bill_name, member_name: "KARAN", paid: 0, spent: 1130, balance: -1130 },
    { bill_name: bill_name, member_name: "RAHUL", paid: 500, spent: 1730, balance: -1230 }, { bill_name: bill_name, member_name: "SHIVAY", paid: 2400, spent: 980, balance: 1420 }
    ]
    const expense_records = [
        { bill_name: bill_name, record_name: "TRAVEL", record_payment: [['RAM', 2000], ['SHYAM', 1000]], shared_by: ['RAM', 'SHYAM', 'KARAN', 'RAHUL'], total_amount: 3000 },
        { bill_name: bill_name, record_name: "DINNER", record_payment: [['SHYAM', 400], ['RAHUL', 500], ['SHIVAY', 1000]], shared_by: ['RAM', 'SHYAM', 'KARAN', 'RAHUL', 'SHIVAY'], total_amount: 1900 },
        { bill_name: bill_name, record_name: "HOTEL", record_payment: [['SHYAM', 1000], ['SHIVAY', 1400]], shared_by: ['RAM', 'SHYAM', 'RAHUL', 'SHIVAY'], total_amount: 2400 }
    ]

    if (index === 0) {
        for (let i = 0; i < bill_members.length; i++) {
            store.add(bill_members[i])
        }
    } else if (index === 1) {
        for (let j = 0; j < expense_records.length; j++) {
            store.add(expense_records[j])
        }
    } else if (index === 2) {
        store.add(bill_info);
    } else {
        console.log("Nothing to add");
    }
}

//creating new bill 
function generate_new_bill(bill_name, bill_members_names) {
    const bill_info = [{
        bill_name: bill_name,
        summary: []
    }]
    let bill_members = [];
    for (let i = 0; i < bill_members_names.length; i++) {
        const member = {
            bill_name: bill_name,
            member_name: bill_members_names[i],
            paid: 0,
            spent: 0,
            balance: 0
        }
        bill_members.push(member);
    }

    add_object_to_store(store_list[2].name, bill_info);
    add_object_to_store(store_list[0].name, bill_members);
    show_page("bill_view_page");
    update_bill_expense_page(bill_name);
    update_info_table();
}

//common function for adding object to object store
function add_object_to_store(store_name, objects) {
    const transaction = db.transaction(store_name, "readwrite");
    const obj_store = transaction.objectStore(store_name);
    objects.forEach(object => {
        const add_object_req = obj_store.add(object);
        add_object_req.onsuccess = () => {
            console.log("Entry added to " + store_name + " successfully!");
        }
        add_object_req.onerror = () => {
            console.log(add_object_req.error);
        }
    });
}

//updating bill view page after selecting bill to view
function update_bill_expense_page(bill_name) {
    //getting data from member store to generate inputs on bill view page
    const transaction = db.transaction(store_list[0].name, "readonly");
    const req = transaction.objectStore(store_list[0].name).index("bill_name").getAll(bill_name);
    let bill_record_div = document.getElementById("bill_record_inputs");
    req.onsuccess = () => {
        let amount_inputs = `<h3>Paid By</h3><ul id="bill_paid_by">`;
        let shared_inputs = `<h3>Shared By</h3><ul id="bill_shared_by">`;
        const members = req.result;

        members.forEach(member => {
            amount_inputs += `<li><label for="paid_by_${member.member_name}">${member.member_name} </label>
                            <input type="number" name="paid_by_${member.member_name}"/></li>`;
            shared_inputs += `<li><label for="shared_by_${member.member_name}">${member.member_name} </label>
                            <input type="checkbox" name="shared_by_${member.member_name}" checked></li>`;
        });
        amount_inputs += "</ul>";
        shared_inputs += "</ul>";
        bill_record_div.innerHTML = amount_inputs + shared_inputs;
        document.getElementById("bill_view_name").innerText = bill_name;
        update_bill_page_data(bill_name);
    }
    req.onerror = () => {
        console.log(req.error);
    }
}

//updating bill view page tables and inputs
function update_bill_page_data(bill_name) {
    document.getElementById("new_expense_error").innerText = "";
    document.getElementById("bill_record_name").value = "";
    let member_record_table = document.getElementById("member_record_table");
    let expense_record_table = document.getElementById("expense_record_table");
    const transaction = db.transaction([store_list[0].name, store_list[1].name], "readonly");
    const member_req = transaction.objectStore(store_list[0].name).index("bill_name").getAll(bill_name);
    const record_req = transaction.objectStore(store_list[1].name).index("bill_name").getAll(bill_name);

    //updating member table
    member_req.onsuccess = () => {
        let table_data = "<tr><th>NAME</th><th>PAID</th><th>SPENT</th></tr>";
        const members = member_req.result;
        members.forEach(member => {
            table_data += `<tr><td>${member.member_name}</td>
            <td>${member.paid}</td>
            <td>${member.spent}</td>
            </tr>`
        });
        member_record_table.innerHTML = table_data;
    }
    member_req.onerror = () => {
        console.log(member_req.error);
    }

    //updating expense record table
    record_req.onsuccess = () => {
        let table_data = "<tr><th>NAME</th><th>PAYMENT</th><th>SHARED BY</th><th>TOTAL AMOUNT</th><th>OPTIONS</th></tr>";
        const records = record_req.result;
        records.forEach(record => {
            let record_payment_list = "<ul>";
            record.record_payment.forEach(p => {
                record_payment_list += `<li>${p[0]} - ${p[1]}</li>`;
            });
            record_payment_list += "</ul>";
            table_data += `<tr><td>${record.record_name}</td>
            <td>${record_payment_list}</td>
            <td>${record.shared_by.join(", ")}</td>
            <td>${record.total_amount}</td>
            <td><button class="del-btn close-btn" data-record_name="${record.record_name}">Del</button></td></tr>`;
        });
        expense_record_table.innerHTML = table_data;
    }
    record_req.onerror = () => {
        console.log(record_req.error);
    }


}

//refreshing bill table
function update_info_table() {

    let info_table = document.getElementById("info_table");
    const transaction = db.transaction(store_list[2].name, "readonly");
    const req = transaction.objectStore(store_list[2].name).getAll();
    req.onsuccess = () => {
        let table_data = "<tr><th>NAME</th><th>SUMMARY</th><th>Options</th></tr>";
        const bills = req.result;
        bills.forEach(bill => {
            let summary = "";
            bill.summary.forEach(e => {
                summary += `<p><span class="payment-list"> ${e[0]} <span class="arrow-banner">${e[1]}</span> ${e[2]} </span></p>`;
            });
            table_data += `<tr><td>${bill.bill_name}</td>
            <td>${summary}</td>
            <td><button class="view-btn" data-bill_name="${bill.bill_name}">View & Edit</button>
            <button class="del-btn close-btn" data-bill_name="${bill.bill_name}">Del</button></td></tr>`
        });
        info_table.innerHTML = table_data;
    }
    req.onerror = () => {
        console.log(req.error);
    }
    transaction.oncomplete = () => {
        // if (document.getElementById("info_table").getElementsByTagName("tr").length === 1) {
        //     add_example_bill();
        //     show_page("bill_page")
        // }
    }
}

//Adding new expense record to store
function add_new_record(bill_name, record_name, paid_amounts, shared_by_checked) {
    let total_amount = 0;
    let total_shared_by = 0;

    for (let i = 0; i < paid_amounts.length; i++) {
        total_amount += paid_amounts[i];
    }

    for (let j = 0; j < shared_by_checked.length; j++) {
        if (shared_by_checked[j] == true) {
            total_shared_by++;
        }
    }
    const spent_by_each = Math.floor(total_amount / total_shared_by);
    const transaction = db.transaction([store_list[0].name, store_list[1].name], "readwrite");
    const member_req = transaction.objectStore(store_list[0].name).index("bill_name").getAll(bill_name);

    member_req.onsuccess = () => {
        let members = member_req.result;//getting member's previous record
        let record_payment = [];//for adding payment record from inputs in '[name,amount]' form
        let shared_by = [];//for adding members who has shared the expense

        //updating members records
        for (let k = 0; k < members.length; k++) {
            let paid_amt = paid_amounts[k];

            members[k].paid += paid_amt;
            if (paid_amt != 0) {
                record_payment.push([members[k].member_name, paid_amt]);
            }
            if (shared_by_checked[k] == true) {
                members[k].spent += spent_by_each;//increasing the expense of shared members
                members[k].balance += paid_amt - spent_by_each;//increasing the balance for paid+shared member
                shared_by.push(members[k].member_name);
            } else {
                members[k].balance += paid_amt;//increasing the balance for only paid member
            }
        }

        //adding the new member record to member store
        members.forEach(member => {
            const member_update_req = transaction.objectStore(store_list[0].name).put(member);
            member_update_req.onsuccess = () => {
                console.log(member.member_name + " updated successfully!");
            }
        });

        //new expense record object
        const new_record = {
            bill_name: bill_name,
            record_name: record_name,
            record_payment: record_payment,
            shared_by: shared_by,
            total_amount: total_amount
        }

        //adding new expense record to expense store
        const record_update_req = transaction.objectStore(store_list[1].name).add(new_record);
        record_update_req.onsuccess = () => {
            console.log(record_name + " added successfully!");
        }

    }
    member_req.onerror = () => {
        console.log(req.error);
    }
    transaction.oncomplete = () => {
        //refreshing the bill view page and generating the summary again for new balances
        generate_bill_summary(bill_name);
        update_bill_expense_page(bill_name)
    }

}

//Generating bill summary using the balances of members
function generate_bill_summary(bill_name) {
    const db_transaction = db.transaction(store_list[0].name, "readonly");
    const member_req = db_transaction.objectStore(store_list[0].name).index("bill_name").getAll(bill_name);
    member_req.onsuccess = () => {
        const user_data = member_req.result;
        let payor = [];//for getting members whose balance is -ve (who will pay) [name,balance]
        let receiver = [];//for getting members whose balance is +ve (who will get payment)
        let paid_total_amount = 0;//for getting total amount to be paid (only adding +ve balance)
        //let paid_clear = [];
        for (let i = 0; i < user_data.length; i++) {
            if (user_data[i].balance < 0) {
                payor.push([user_data[i].member_name, user_data[i].balance * (-1)]);//multiplying by payor balance by (-1) to make it +ve
            } else if (user_data[i].balance > 0) {
                receiver.push([user_data[i].member_name, user_data[i].balance]);
                paid_total_amount += user_data[i].balance;
            }
        }
        let summary = [];//declaring summary variable

        /*First checking the members with +ve and -ve balance
          who has the same balance and clear their balance first
          to decrease the no. of transactions
        */
        let same_transaction_complete = false;
        let j = 0, k = 0;
        while (!same_transaction_complete && payor.length > 0) {
            if (payor[j][1] == receiver[k][1]) {
                summary.push([payor[j][0], receiver[k][1], receiver[k][0]]);
                paid_total_amount -= receiver[k][1];
                payor.splice(j, 1);
                receiver.splice(k, 1);
            } else {
                k++;
            }
            if (k >= receiver.length) {
                k = 0;
                j++;
            }
            if (j >= payor.length) {
                same_transaction_complete = true;
            }
        }

        /*
        Now generating transaction for members have different balance
        iterating the payor(who will pay) and receiver(who will receive)
        one by one and removing the balance with less value from array and
        continue...
        balance array = [[member1,amount],[member2,amount]]
        so amount = array[i][1]
        */
        while (paid_total_amount > 1 && payor.length > 0) {
            //if payer amount < receiver amount => full amount is paid by payer and payer is removed
            if (payor[0][1] < receiver[0][1]) {
                summary.push([payor[0][0], payor[0][1], receiver[0][0]]);
                paid_total_amount -= payor[0][1];
                receiver[0][1] -= payor[0][1];
                payor.splice(0, 1);//payer removed

                //if payor amount  > receiver amount =>full amount is paid to receiver and receiver is removed
            } else if (payor[0][1] >= receiver[0][1]) {
                summary.push([payor[0][0], receiver[0][1], receiver[0][0]]);
                paid_total_amount -= receiver[0][1];
                payor[0][1] -= receiver[0][1];
                receiver.splice(0, 1);
            }
        }

        //Adding new summary to bill info store
        const txn_2 = db.transaction(store_list[2].name, "readwrite");
        const bill_info_req = txn_2.objectStore(store_list[2].name).index("bill_name").get(bill_name);
        bill_info_req.onsuccess = () => {
            let bill_info = bill_info_req.result;
            bill_info.summary = summary;
            const info_update_req = txn_2.objectStore(store_list[2].name).put(bill_info);
            info_update_req.onsuccess = () => {
                console.log("Summary updated successfully!");
            }
        }
        //console.table(summary);
    }
    db_transaction.oncomplete = () => {
        update_info_table();
    }

}

//deleting a particular bill
function delete_bill() {
    const bill_name = document.getElementById("bill_delete_confirm").dataset.bill_name;
    const transaction = db.transaction([store_list[2].name, store_list[0].name, store_list[1].name], "readwrite");
    const info_store = transaction.objectStore(store_list[2].name);
    const member_store = transaction.objectStore(store_list[0].name);
    const record_store = transaction.objectStore(store_list[1].name);
    const info_req = info_store.index("bill_name").openKeyCursor(IDBKeyRange.only(bill_name));
    const member_req = member_store.index("bill_name").openKeyCursor(IDBKeyRange.only(bill_name));
    const record_req = record_store.index("bill_name").openKeyCursor(IDBKeyRange.only(bill_name));
    info_req.onsuccess = () => {
        const cursor = info_req.result;
        if (cursor) {
            info_store.delete(cursor.primaryKey);//getting primary key to delete object
            cursor.continue();
        }
    }
    info_req.onerror = () => {
        console.log(info_req.error);
    }

    member_req.onsuccess = () => {
        const cursor = member_req.result;
        if (cursor) {
            member_store.delete(cursor.primaryKey);
            cursor.continue();
        }
    }
    member_req.onerror = () => {
        console.log(member_req.error);
    }

    record_req.onsuccess = () => {
        const cursor = record_req.result;
        if (cursor) {
            record_store.delete(cursor.primaryKey);
            cursor.continue();
        }
    }
    record_req.onerror = () => {
        console.log(record_req.error);
    }
    transaction.oncomplete = () => {
        update_info_table();
        close_delete_modal();
    }

}


//deleting particulat expense record
function delete_record(bill_name, record_name) {
    const transaction = db.transaction([store_list[0].name, store_list[1].name], "readwrite");
    const record_store = transaction.objectStore(store_list[1].name)
    const record_req = record_store.index("bill_name").openCursor(IDBKeyRange.only(bill_name));

    record_req.onsuccess = () => {
        const cursor = record_req.result;
        if (cursor.value.record_name == record_name) {
            const record = cursor.value;
            let spent_by_each = Math.round((record.total_amount) / (record.shared_by.length));
            let record_payment = record.record_payment;
            let shared_by = record.shared_by;
            console.log(record.total_amount, spent_by_each)

            const member_req = transaction.objectStore(store_list[0].name).index("bill_name").getAll(bill_name);
            member_req.onsuccess = () => {
                let members = member_req.result;//getting current members balances
                //updating balances before deleting expense record
                for (let k = 0; k < members.length; k++) {
                    const name_index = record_payment.findIndex(r => r.includes(members[k].member_name));
                    if (name_index > -1) {
                        members[k].paid -= record_payment[name_index][1];
                        members[k].balance -= record_payment[name_index][1];
                    }

                    if (shared_by.includes(members[k].member_name)) {
                        members[k].spent -= spent_by_each;
                        members[k].balance += spent_by_each;
                    }
                }
                members.forEach(member => {
                    const member_update_req = transaction.objectStore(store_list[0].name).put(member);
                    member_update_req.onsuccess = () => {
                        console.log(member.member_name + " updated successfully!");
                    }
                });
            }
            //deleting expense record
            record_store.delete(cursor.primaryKey);
        } else {
            cursor.continue();
        }
    }
    record_req.onerror = () => {
        console.log(record_req.error);
    }
    transaction.oncomplete = () => {
        update_bill_expense_page(bill_name);
        generate_bill_summary(bill_name);
    }
}

/*
js file for managing database
*/
let db;


const localFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
});

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
    const db_request = indexedDB.open("bill_splitter", 2);
    db_request.onsuccess = () => {
        console.log("Database Opened!");
        db = db_request.result;//assigning database to db variable for future uses
        update_bill_container();//Refreshing bill table
    }

    db_request.onerror = (event) => {
        console.log("Database Error: " + db_request.error);
    }
    //initialising upgrade or database for first time
    db_request.onupgradeneeded = (event) => {
        const up_db = event.target.result;
        const oldVersion = event.oldVersion;
        console.log("Creating Stores....");

        if (oldVersion == 1) {
            const storesToDelete = [store_list[0].name, store_list[1].name, store_list[2].name];

            storesToDelete.forEach(storeName => {
                if (up_db.objectStoreNames.contains(storeName)) {
                    // Completely removes the store and all its indexes/auto-increment counters
                    up_db.deleteObjectStore(storeName);
                    console.log(`Deleted old decimal store: ${storeName}`);
                }
            });
        }

        // Creating multiple stores (Fresh creation for new users OR recreation for upgraded users)
        for (let i = 0; i < store_list.length; i++) {
            if (!up_db.objectStoreNames.contains(store_list[i].name)) {
                const store = up_db.createObjectStore(store_list[i].name, { keyPath: "id", autoIncrement: true });

                // Adding Indexes dynamically for the recreated store
                for (let j = 0; j < store_list[i].indexes.length; j++) {
                    const index_name = store_list[i].indexes[j].index_name;
                    const index_unique = store_list[i].indexes[j].unique;
                    store.createIndex(index_name, index_name, { unique: index_unique });
                }

                // Adds the clean, integer-cents based example data
                add_example_bill(store, i);
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
    const bill_name = "GOA TRIP (DEMO)";
    const bill_info = {
        bill_name: bill_name,
        summary: [['KARAN', 27000, 'RAM'], ['KARAN', 67000, 'SHYAM'], ['KARAN', 19000, 'SHIVAY'], ['RAHUL', 123000, 'SHIVAY']]
    }
    const bill_members = [{ bill_name: bill_name, member_name: "RAM", paid: 200000, spent: 173000, balance: 27000 },
    { bill_name: bill_name, member_name: "SHYAM", paid: 240000, spent: 173000, balance: 67000 }, { bill_name: bill_name, member_name: "KARAN", paid: 0, spent: 113000, balance: -113000 },
    { bill_name: bill_name, member_name: "RAHUL", paid: 50000, spent: 173000, balance: -123000 }, { bill_name: bill_name, member_name: "SHIVAY", paid: 240000, spent: 98000, balance: 142000 }
    ]
    const expense_records = [
        { bill_name: bill_name, record_name: "TRAVEL", record_payment: [['RAM', 200000], ['SHYAM', 100000]], shared_by: [['RAM', 75000], ['SHYAM', 75000], ['KARAN', 75000], ['RAHUL', 75000]], total_amount: 300000 },
        { bill_name: bill_name, record_name: "DINNER", record_payment: [['SHYAM', 40000], ['RAHUL', 50000], ['SHIVAY', 100000]], shared_by: [['RAM', 38000], ['SHYAM', 38000], ['KARAN', 38000], ['RAHUL', 38000], ['SHIVAY', 38000]], total_amount: 190000 },
        { bill_name: bill_name, record_name: "HOTEL", record_payment: [['SHYAM', 100000], ['SHIVAY', 140000]], shared_by: [['RAM', 60000], ['SHYAM', 60000], ['RAHUL', 60000], ['SHIVAY', 60000]], total_amount: 240000 }
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
    update_bill_container();
    showToast("bill " + bill_name + " generated successfully");
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
        let amount_inputs = `<hr><h3>Paid By</h3><div id="bill_paid_by" class="inputs-list">`;
        let equally_shared_inputs = "";
        let unequal_shared_inputs = "";
        const members = req.result;

        members.forEach(member => {
            amount_inputs += `<div class="text-input-wrapper"><label for="paid_by_${member.member_name}">${member.member_name} </label><input type="number" min="0" id="paid_by_${member.member_name}"/></div>
            `;
            equally_shared_inputs += `<div class="checkbox-wrapper"><input type="checkbox" id="equally_shared_by_${member.member_name}" checked><label for="equally_shared_by_${member.member_name}">${member.member_name} </label></div>
            `;
            unequal_shared_inputs += `<div class="text-input-wrapper"><label for="unequal_shared_by_${member.member_name}">${member.member_name} </label><input type="number" min="0" id="unequal_shared_by_${member.member_name}"/></div>
            `;
        });
        amount_inputs += "</div>";
        let shared_inputs = `
        <h3>Shared By</h3>
        <div class="tab-container design-pill">
            <!-- Radio Controls (Hidden) -->
            <input type="radio" name="tabs-pill" id="equally-shared" checked>
            <input type="radio" name="tabs-pill" id="unequal-shared">

            <!-- Tab Buttons Label Bar -->
            <div class="tab-nav" id="bill_shared_option">
                <label for="equally-shared">Equally</label>
                <label for="unequal-shared">By Amount</label>
            </div>

            <!-- Tab Contents Box -->
            <div class="tab-content content-1 input-lists" id="equally_shared_by">
                ${equally_shared_inputs}
            </div>

            <div class="tab-content content-2 input-lists" id="unequal_shared_by">
                ${unequal_shared_inputs}
            </div>
        </div>`;
        //'<div id="bill_shared_by" class="inputs-list">'
        bill_record_div.innerHTML = amount_inputs + "<hr>" + shared_inputs;
        document.getElementById("bill_view_name").innerText = bill_name;
        update_bill_page_data(bill_name);
    }
    req.onerror = () => {
        console.log(req.error);
    }
}

//updating bill view page tables and inputs
function update_bill_page_data(bill_name) {
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
            <td>${member.paid / 100}</td>
            <td>${member.spent / 100}</td>
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
            record.record_payment.forEach(([m, amt]) => {
                record_payment_list += `<li>${m} - ${amt / 100}</li>`;
            });
            record_payment_list += "</ul>";
            let record_shared_list = "<ul>";
            record.shared_by.forEach(([m, amt]) => {
                record_shared_list += `<li>${m} - ${amt / 100}</li>`;
            });
            record_shared_list += "</ul>";
            table_data += `<tr><td>${record.record_name}</td>
            <td>${record_payment_list}</td>
            <td>${record_shared_list}</td>
            <td>${record.total_amount / 100}</td>
            <td><button class="del-btn close-btn" data-record_name="${record.record_name}">Del</button></td></tr>`;
        });
        expense_record_table.innerHTML = table_data;
    }
    record_req.onerror = () => {
        console.log(record_req.error);
    }


}

//refreshing bill table
function update_bill_container() {

    const left_bill_col = document.getElementById("bill-container-left-col");
    const right_bill_col = document.getElementById("bill-container-right-col");
    const transaction = db.transaction(store_list[2].name, "readonly");
    const req = transaction.objectStore(store_list[2].name).getAll();
    req.onsuccess = () => {
        let left_col_data = "";
        let right_col_data = "";
        let table_data = "";
        const bills = req.result;
        let i = 0;
        bills.forEach(bill => {
            let summary = "";
            bill.summary.forEach(([p1, amt, p2]) => {
                //
                summary += `<p class="payment-list">💸 <strong>${p1}</strong> pays <strong>${p2}</strong>: ${localFormatter.format(amt / 100)}</p>`;
            });
            if (summary === "") {
                summary = `<div class="empty-state-bill">Add expenses to see calculations.</div>`;
            }
            if (i % 2 == 0) {
                left_col_data += `

                <div class="bill-card">
                <div id="user-bill-${bill.id}" class="bill-card-details">
                <h2 class="bill-title">${bill.bill_name}</h2>
                <h3>Who Pays Whom</h3>
                ${summary}
                </div>
                <div class="bill-card-options">
                <button class="view-btn" data-bill-name="${bill.bill_name}" title="View Bill Details">View & Edit</button>
                <button class="del-btn close-btn" data-bill-name="${bill.bill_name}" title="Delete Bill">Del</button>
                <button class="download-btn" data-bill-card-id="user-bill-${bill.id}" data-bill-name="${bill.bill_name}">📥</button>
                <button class="whatsapp-btn" data-bill-card-id="user-bill-${bill.id}" data-bill-name="${bill.bill_name}">WhatsApp</button>
                </div>
                </div>`;

            } else {
                right_col_data += `
                <div class="bill-card">
                <div id="user-bill-${bill.id}" class="bill-card-details">
                <h2 class="bill-title">${bill.bill_name}</h2>
                <h3>Who Pays Whom</h3>
                ${summary}
                </div>
                <div class="bill-card-options">
                <button class="view-btn" data-bill-name="${bill.bill_name}" title="View Bill Details">View & Edit</button>
                <button class="del-btn close-btn" data-bill-name="${bill.bill_name}" title="Delete Bill">Del</button>
                <button class="download-btn" data-bill-card-id="user-bill-${bill.id}" data-bill-name="${bill.bill_name}">📥</button>
                <button class="whatsapp-btn" data-bill-card-id="user-bill-${bill.id}" data-bill-name="${bill.bill_name}">WhatsApp</button>
                </div>
                </div>
                `;
            }
            i++;
        });
        left_bill_col.innerHTML = left_col_data;
        right_bill_col.innerHTML = right_col_data;
    }
    req.onerror = () => {
        console.log(req.error);
    }
    transaction.oncomplete = () => {
        // if (document.getElementById("bill_container").getElementsByTagName("tr").length === 1) {
        //     add_example_bill();
        //     show_page("bill_page")
        // }
    }
}


//updating a single bill card rather than whole data
function update_bill_card(bill_id) {
    const transaction = db.transaction(store_list[2].name, "readonly");
    const req = transaction.objectStore(store_list[2].name).get(bill_id);
    let summary = "";
    req.onsuccess = () => {
        const bill = req.result;

        bill.summary.forEach(([p1, amt, p2]) => {
            summary += `<p class="payment-list">💸 <strong>${p1}</strong> pays <strong>${p2}</strong>: ${localFormatter.format(amt / 100)}</p>`;
        });
        if (summary === "") {
            summary = `<div class="empty-state-bill">Add expenses to see calculations.</div>`;
        }

        const bill_card_data = `
            <h2 class="bill-title">${bill.bill_name}</h2>
            <h3>Who Pays Whom</h3>
            ${summary}
            `;
        document.getElementById(`user-bill-${bill.id}`).innerHTML = bill_card_data;
    }
    req.onerror = ()=>{
        console.log(req.error);
    }
}

//Adding new expense record to store
function add_new_record(bill_name, record_name, paid_amounts, spent_amounts, total_amount) {
    const transaction = db.transaction([store_list[0].name, store_list[1].name], "readwrite");
    const member_req = transaction.objectStore(store_list[0].name).index("bill_name").getAll(bill_name);

    member_req.onsuccess = () => {
        let members = member_req.result;//getting member's previous record
        let record_payment = [];//for adding payment record from inputs in '[name,amount]' form
        let shared_by = [];//for adding members who has shared the expense

        //updating members records
        for (let k = 0; k < members.length; k++) {
            let paid_amt = paid_amounts[k];
            let spent_amt = spent_amounts[k];

            members[k].paid += paid_amt;
            members[k].spent += spent_amt;//increasing the expense of shared members
            members[k].balance += paid_amt - spent_amt;//increasing the balance for paid+shared member

            if (paid_amt != 0) {
                record_payment.push([members[k].member_name, paid_amt]);
            }
            if (spent_amt != 0) {
                shared_by.push([members[k].member_name, spent_amt])
            }
        }

        //adding the new member record to member store
        members.forEach(member => {
            const member_update_req = transaction.objectStore(store_list[0].name).put(member);
            member_update_req.onsuccess = () => {
                //console.log(member.member_name + " updated successfully!");
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
            //console.log(record_name + " added successfully!");
        }

    }
    member_req.onerror = () => {
        console.log(req.error);
    }
    transaction.oncomplete = () => {
        //refreshing the bill view page and generating the summary again for new balances
        generate_bill_summary(bill_name);
        update_bill_expense_page(bill_name);
        showToast("new record added successfully")
    }

}

//Generating bill summary using the balances of members
function generate_bill_summary(bill_name) {
    const db_transaction = db.transaction(store_list[0].name, "readonly");
    const member_req = db_transaction.objectStore(store_list[0].name).index("bill_name").getAll(bill_name);
    member_req.onsuccess = () => {
        const user_data = member_req.result;
        const total_members = user_data.length;
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

        for (let j = 0; j < payor.length; j++) {
            for (let k = 0; k < receiver.length; k++) {

                // If a perfect match is found
                if (payor[j][1] === receiver[k][1]) {
                    // Record the transaction
                    summary.push([payor[j][0], receiver[k][1], receiver[k][0]]);

                    // Subtract from total if you track it
                    paid_total_amount -= receiver[k][1];

                    // Remove the settled members from their arrays
                    payor.splice(j, 1);
                    receiver.splice(k, 1);

                    // Because we removed an item from 'payor', 
                    // we must step 'j' back by 1 so the loop doesn't skip the next person!
                    j--;

                    // Break the inner loop to start scanning for the next payer
                    break;
                }
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


        while (payor.length > 0 && receiver.length > 0) {

            // Sort inside the loop so the largest remaining amounts always collide
            payor.sort((a, b) => b[1] - a[1]);
            receiver.sort((a, b) => b[1] - a[1]);

            let payor_id = payor[0][0];
            let receiver_id = receiver[0][0];

            let amount_to_pay = Math.min(payor[0][1], receiver[0][1]);

            summary.push([payor_id, amount_to_pay, receiver_id]);

            payor[0][1] -= amount_to_pay;
            receiver[0][1] -= amount_to_pay;

            if (payor[0][1] <= 0) payor.shift();
            if (receiver[0][1] <= 0) receiver.shift();
        }


        //Wipe out any fractional remnants left behind by independent rounding
        const pennyDustThreshold = 100;//1 rupee
        const cleanSummary = summary.filter(transaction => transaction[1] > pennyDustThreshold);


        //Adding new summary to bill info store
        const txn_2 = db.transaction(store_list[2].name, "readwrite");
        const bill_info_req = txn_2.objectStore(store_list[2].name).index("bill_name").get(bill_name);
        bill_info_req.onsuccess = () => {
            let bill_info = bill_info_req.result;
            const bill_id = bill_info.id;
            bill_info.summary = cleanSummary;
            const info_update_req = txn_2.objectStore(store_list[2].name).put(bill_info);
            info_update_req.onsuccess = () => {
                console.log("Summary updated successfully!");
                update_bill_card(bill_id);

            }
        }
        //console.table(summary);
    }
    db_transaction.oncomplete = () => {
        //update_bill_container();
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
        showToast("failed to delete the bill")
        console.log(record_req.error);
    }
    transaction.oncomplete = () => {
        update_bill_container();
        close_delete_modal();
        showToast("Deleted the bill");
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
            const record_payment = record.record_payment;
            const shared_by = record.shared_by;


            const member_req = transaction.objectStore(store_list[0].name).index("bill_name").getAll(bill_name);
            member_req.onsuccess = () => {
                let members = member_req.result;//getting current members balances
                //updating balances before deleting expense record
                for (let k = 0; k < members.length; k++) {
                    const payment_name_index = record_payment.findIndex(r => r.includes(members[k].member_name));
                    const shared_name_index = shared_by.findIndex(r => r.includes(members[k].member_name));
                    if (payment_name_index > -1) {
                        members[k].paid -= record_payment[payment_name_index][1];
                        members[k].balance -= record_payment[payment_name_index][1];
                    }
                    if (shared_name_index > -1) {
                        members[k].spent -= shared_by[shared_name_index][1];
                        members[k].balance += shared_by[shared_name_index][1];
                    }
                }
                members.forEach(member => {
                    const member_update_req = transaction.objectStore(store_list[0].name).put(member);
                    member_update_req.onsuccess = () => {
                        //console.log(member.member_name + " updated successfully!");
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
        showToast("bill record deleted successfully");
    }
}

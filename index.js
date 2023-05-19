const cli = require('./cli.js');
// Setup SQL
const mysql = require('mysql');

// Create a promise that resolves when the database connects
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'tracker_db'
});
dbPromise = new Promise((resolve) => {
    db.connect((err) => {
        if (err) throw err;
        console.log('Connected to database');
        resolve();
    });
});

// View, Add, Update, Delete
function view (table) {
    return new Promise((resolve) => {
        db.query(`SELECT * FROM ${table}`,(err,res) => {
            if (err) throw err;
            console.table(res);
            resolve();
        });
    });
}

function add (table, columns, values) {
    columns = columns.join(',');

    // Map each value to a string representation of that value, correctly formatted for SQL.
    values = values.map(value => {
        if (typeof value === 'string') {
            // Escape single quotes in the string to prevent SQL injection attacks.
            value = value.replace(/'/g, "''");
            return `'${value}'`;
        }
        return value;
    }).join(',');

    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO ${table} (${columns}) VALUES (${values})`,(err,res) => {
            if (err) {
                console.log('Error:', err);
                return reject(err);
            }
            console.log('Added');
            resolve();
        });
    });
}

function update (table,columns,values,condition) {
    if (typeof values === 'string') {
        values = `'${values}'`;
    }
    return new Promise((resolve) => {
        db.query(`UPDATE ${table} SET ${columns} = ${values} WHERE ${condition}`,(err,res) => {
            if (err) throw err;
            console.log('Updated');
            resolve();
        });
    });
}

function del (table,condition) {
    return new Promise((resolve) => {
        db.query(`DELETE FROM ${table} WHERE ${condition}`,(err,res) => {
            if (err) throw err;
            console.log('Deleted');
            resolve();
        });
    });
}

// Handle menu
async function handleMenu(query, itemName, promptName) {
    // Get possible items
    let items = await new Promise((resolve) => {
        db.query(query,(err,res) => {
            if (err) throw err;
            resolve(res);
        });
    });
    // Create a string of possible items
    let itemMenu = `Select a ${promptName}:\n`;
    for (let i = 0; i < items.length; i++) {
        itemMenu += `${i + 1}. ${items[i][itemName]}\n`;
    }
    // Get item id
    let itemId = await cli.handle(itemMenu,(answer) => {
        return answer.length > 0 && !isNaN(answer) && answer > 0 && answer <= items.length;
    });
    // Return item id to values
    return items[itemId - 1].id;
}

// Executes after dbPromise resolves
dbPromise.then(() => {
    // Get possible tables
    return new Promise((resolve) => {
        db.query('SHOW TABLES',(err,res) => {
            if (err) throw err;
            let tables = [];
            for (let i = 0; i < res.length; i++) {
                tables[i] = res[i][`Tables_in_${db.config.database}`];
            }
            resolve(tables);
        });
    })
}).then((tables) => {
    var mainMenu = 'Select a table:\n';
    for (let i = 0; i < tables.length; i++) {
        mainMenu += `${i + 1}. ${tables[i]}\n`;
    }
    main(tables,mainMenu);
});

    

function main (tables,mainMenu) {
    cli.handle(mainMenu,(answer) => {
        // Greater than 0, valid number, less than or equal to number of tables
        return answer.length > 0 && !isNaN(answer) && answer > 0 && answer <= tables.length;
    }).then((answer) => {
        let table = tables[answer - 1];
        cli.handle(`Select an action for ${table}:\n1. View\n2. Add\n3. Update\n4. Delete\n`,(answer) => {
            return answer.length > 0 && !isNaN(answer) && answer > 0 && answer <= 5;
        }).then((answer) => {
            
            // Switch thru view, add, update, delete
            switch (answer) {
                //View
                case '1':
                    view(table).then(() => {
                        main(tables,mainMenu);
                    });
                    break;
                // Add
                case '2':
                    // Get columns
                    columnPromise = new Promise((resolve) => {
                        db.query(`SHOW COLUMNS FROM ${table}`,(err,res) => {
                            if (err) throw err;
                            let columns = [];
                            // i = 1 to skip id column
                            for (let i = 1; i < res.length; i++) {
                                columns[i-1] = res[i].Field;
                            }
                            resolve(columns);
                        });
                    });
                    columnPromise.then(async (columns) => {
                        // Get values
                        let values = [];
                        for (let i = 0; i < columns.length; i++) {
                            switch (columns[i]) {
                                case 'department_id':
                                    values[i] = await handleMenu('SELECT * FROM departments','name','department');
                                    break;
                                case 'role_id':
                                    values[i] = await handleMenu('SELECT * FROM roles','title','role');
                                    break;
                                case 'manager_id':
                                    values[i] = await handleMenu('SELECT * FROM employees','first_name','manager');
                                    break;
                                default:
                                    values[i] = await cli.handle(`Enter ${columns[i]}:`,(answer) => {
                                        return answer.length > 0;
                                    });
                                    break;
                            }
                        }
                        // Add
                        add(table,columns,values).then(() => {
                            main(tables,mainMenu);
                        });
                    });
                    break;
                // Update
                case '3':
                    // Show items from table but use item to select id
                    columnPromise = new Promise((resolve) => {
                        db.query(`SHOW COLUMNS FROM ${table}`,(err,res) => {
                            if (err) throw err;
                            let columns = [];
                            for (let i = 0; i < res.length; i++) {
                                columns[i] = res[i].Field;
                            }
                            resolve(columns);
                        });
                    });
                    columnPromise.then(async (columns) => {
                        // Get id
                        let id = await handleMenu(`SELECT * FROM ${table}`,columns[1],table);
                        // Get columns
                        let columnsMenu = `Select a column to update:\n`;
                        // i = 1 to skip id column
                        for (let i = 1; i < columns.length; i++) {
                            columnsMenu += `${i}. ${columns[i]}\n`;
                        }
                        let columnId = await cli.handle(columnsMenu,(answer) => {
                            return answer.length > 0 && !isNaN(answer) && answer > 0 && answer <= columns.length;
                        });
                        // Get value
                        let value;
                        switch (columns[columnId]) {
                            case 'department_id':
                                value = await handleMenu('SELECT * FROM departments','name','department');
                                break;
                            case 'role_id':
                                value = await handleMenu('SELECT * FROM roles','title','role');
                                break;
                            case 'manager_id':
                                value = await handleMenu('SELECT * FROM employees','first_name','manager');
                                break;
                            default:
                                value = await cli.handle(`Enter ${columns[columnId]}:`,(answer) => {
                                    return answer.length > 0;
                                });
                                break;
                        }
                        // Update
                        update(table,columns[columnId],value,`id = ${id}`).then(() => {
                            main(tables,mainMenu);
                        });
                    });
                    break;
                // Delete
                case '4':
                    // Show items from table but use item to select id
                    columnPromise = new Promise((resolve) => {
                        db.query(`SHOW COLUMNS FROM ${table}`,(err,res) => {
                            if (err) throw err;
                            let columns = [];
                            for (let i = 0; i < res.length; i++) {
                                columns[i] = res[i].Field;
                            }
                            resolve(columns);
                        });
                    });
                    columnPromise.then(async (columns) => {
                        // Get id
                        let id = await handleMenu(`SELECT * FROM ${table}`,columns[1],table);
                        // Delete
                        del(table,`id = ${id}`).then(() => {
                            main(tables,mainMenu);
                        });
                    });
                    break;
                // wtf????
                default:
                    console.log('How did you get here?');
                    break;
            }
        });
    });
}
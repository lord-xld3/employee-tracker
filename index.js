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

function add (table,columns,values) {
    return new Promise((resolve) => {
        db.query(`INSERT INTO ${table} (${columns}) VALUES (${values})`,(err,res) => {
            if (err) throw err;
            console.log('Added');
            resolve();
        });
    });
}

function update (table,columns,values,condition) {
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
        console.log(`Selected ${tables[answer - 1]}`);
        return tables[answer - 1];
    }).then((table) => {
        cli.handle('Select an action:\n1. View\n2. Add\n3. Update\n4. Delete\n',(answer) => {
            return answer.length > 0 && !isNaN(answer) && answer > 0 && answer <= 4;
        }).then((answer) => {
            switch (answer) {

                // View
                case '1':
                    return cli.handle('Select a column to sort by:\n',(column) => {
                        return column.length > 0 && !isNaN(column) && column > 0 && column <= tables.length;
                    }).then((column) => {
                        return view(table,tables[column - 1]);
                    });
                
                // Add
                case '2':
                    return cli.handle('Select a column to add to:\n',(column) => {
                        return column.length > 0 && !isNaN(column) && column > 0 && column <= tables.length;
                    }).then((column) => {
                        return cli.handle('Enter a value:\n',(value) => {
                            return true;
                        }).then((value) => {
                            return add(table,tables[column - 1],value);
                        });
                    }).then(() => {
                        console.log('Added');
                    });
                
                // Update
                case '3':
                    return cli.handle('Select a column to update:\n',(column) => {
                        return column.length > 0 && !isNaN(column) && column > 0 && column <= tables.length;
                    }).then((column) => {
                        return cli.handle('Enter a value:\n',(value) => {
                            return true;
                        }).then((value) => {
                            return update(table,tables[column - 1],value);
                        });
                    }).then(() => {
                        console.log('Updated');
                    });

                // Delete
                case '4':
                    return cli.handle('Select a column to delete from:\n',(column) => {
                        return column.length > 0 && !isNaN(column) && column > 0 && column <= tables.length;
                    }).then((column) => {
                        return cli.handle('Enter a value:\n',(value) => {
                            return true;
                        }).then((value) => {
                            return del(table,tables[column - 1],value);
                        });
                    }).then(() => {
                        console.log('Deleted');
                    });
            }
        });
    }).then(() => {
        // Main loop once finished
        main(tables,mainMenu);
    });
}
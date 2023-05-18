const cli = require('./cli.js');

let departments = [];
let roles = [];
let employees = [];

async function viewDepartments() {console.table(departments);}
async function viewRoles() {console.table(roles);}
async function viewEmployees() {console.table(employees);}

async function addDepartment() {
    let newDepartment = await cli.handle('Enter the name of the department: ', (answer) => {
        return answer.length > 0;
    });
    departments.push({id: departments.length + 1, name: newDepartment});
    console.log('Department added successfully!');
}

async function addRole() {
    let roleName = await cli.handle('Enter the role name: ', (answer) => {
        return answer.length > 0;
    });
    let roleSalary = await cli.handle('Enter the role salary: ', (answer) => {
        return !isNaN(answer);
    });
    let roleDepartment = await cli.handle('Enter the role department: ', (answer) => {
        return (departments.find(d => d.name === answer) || departments.length === 0);
    });
    roles.push({name: roleName, salary: roleSalary, department: roleDepartment});
    console.log('Role added successfully!');
}

async function addEmployee() {
    let firstName = await cli.handle('Enter the employee’s first name: ', (answer) => {
        return answer.length > 0;
    });
    let lastName = await cli.handle('Enter the employee’s last name: ', (answer) => {
        return answer.length > 0;
    });
    let role = await cli.handle('Enter the employee’s role: ', (answer) => {
        return (roles.find(r => r.name === answer) || roles.length === 0);
    });
    let manager = await cli.input('Enter the employee’s manager: ');
    employees.push({id: employees.length + 1, firstName, lastName, role, manager});
    console.log('Employee added successfully!');
}

async function updateEmployeeRole() {
    let employeeId = await cli.handle('Enter the id of the employee to update: ', (answer) => {
        return employees.find(e => e.id == answer);
    });
    let newRole = await cli.handle('Enter the new role for the employee: ', (answer) => {
        return roles.find(r => r.name === answer);
    });
    let employee = employees.find(e => e.id == employeeId);
    employee.role = newRole;
    console.log('Employee role updated successfully!');
}

async function exitApp() {
    console.log('Exiting...');
    rl.close();
}

const actions = [
    viewDepartments,
    viewRoles,
    viewEmployees,
    addDepartment,
    addRole,
    addEmployee,
    updateEmployeeRole,
    exitApp
];

async function app() {
    let userChoice = await cli.handle(`
        Please choose an option:
        1. View all departments
        2. View all roles
        3. View all employees
        4. Add a department
        5. Add a role
        6. Add an employee
        7. Update an employee role
        8. Exit\n`, (answer) => {
            return (Number(answer) > 0 && Number(answer) <= actions.length);
        });

    let actionIndex = Number(userChoice) - 1;
    if (actionIndex >= 0 && actionIndex < actions.length) {
        await actions[actionIndex]();
    } else {
        console.log('Invalid option.');
    }

    if (actionIndex !== actions.length - 1) {
        app();
    }
}

app();

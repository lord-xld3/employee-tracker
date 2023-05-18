const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Handles a single input and returns a thenable promise
function input (prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

// Only useful when data does not depend on previous input and does not need to be sanitized
function multi (prompts) {
    let promises = [];
    for (let i = 0; i < prompts.length; i++) {
        promises[i] = input(prompts[i]);
    }
    return Promise.all(promises);
}

// Handles a single input and compares it using a passed function
function handle (prompt,compareFunc) {
    return new Promise((resolve) => {
        input(prompt).then((answer) => {
            if (compareFunc(answer)) {
                resolve(answer);
            } else {
                console.log('Invalid input');
                handle(prompt,compareFunc);
            }
        });
    });
}

module.exports = {
    input,
    multi,
    handle
};
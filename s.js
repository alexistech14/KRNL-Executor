const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000

app.use(bodyParser.json());

const altsFilePath = path.join(__dirname, 'alts.json');
const logFilePath = path.join(__dirname, 'server.log');
app.get('/count', (req, res) => {
    const filePath = path.join(__dirname, 'alts.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Internal Server Error');
        }

        try {
            const jsonData = JSON.parse(data);
            const count = jsonData.filter(item => item.username).length;
            res.json({ count: count });
                } catch (err) {
            console.error('Error parsing JSON:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

function logAction(action, details) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${action}: ${details}`;
    console.log(logMessage);
    fs.appendFile(logFilePath, logMessage + '\n', (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

function getCurrentDate() {
    const date = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    const day = date.getDate();
    const daySuffix = (day % 10 === 1 && day !== 11) ? 'st' :
        (day % 10 === 2 && day !== 12) ? 'nd' :
            (day % 10 === 3 && day !== 13) ? 'rd' : 'th';

    return formattedDate.replace(day, day + daySuffix);
}

app.post('/generate-alt', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    fs.readFile(altsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read alts.json' });
        }
        let alts = JSON.parse(data);
        const currentDate = getCurrentDate();
        alts.push({
            username: username,
            date: currentDate
        });

        const alt = alts.shift();
        const password = alt.username + alt.username;

        fs.writeFile(altsFilePath, JSON.stringify(alts, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update alts.json' });
            }
            logAction('Account Generated', `Username: ${username}, Date: ${currentDate}`);

            res.json({
                username: alt.username,
                password: password,
                date: alt.date
            });
        });
    });
});

app.post('/add-alt', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    fs.readFile(altsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read alts.json' });
        }

        let alts = JSON.parse(data);
        const currentDate = getCurrentDate();
        alts.push({
            username: username,
            date: currentDate
        });

        fs.writeFile(altsFilePath, JSON.stringify(alts, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update alts.json' });
            }

            logAction('Alt Added', `Username: ${username}, Date: ${currentDate}`);
            res.json({ success: true });
        });
    });
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roblox Alt Generator</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        body {
            background-color: #000000;
            color: #ffffff;
            font-family: 'Poppins', sans-serif;
            font-size: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        input[type="text"] {
            background-color: #161616;
            color: #ffffff;
            border: 0px solid #ffffff00;
            padding: 12px 20px;
            border-radius: 24px;
            width: calc(100% - 40px);
            margin-bottom: 20px;
            text-align: center;
            font-size: 16px;
            transition: border-color 0.1s, outline 0.1s;
            caret-color: transparent;
        }

        input[type="text"]:focus {
            border-color: #555555;
            outline: 2px solid #555555;
        }

        .container {
            text-align: center;
            background-color: #0c0c0c;
            padding: 28px;
            border-radius: 24px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
            min-width: 320px;
            display: inline-block;
            transition: transform 0.1s ease-in-out;
        }

        .container:hover {
            transform: scale(1);
        }

        h1 {
            font-size: 22px;
            margin-bottom: 20px;
            font-weight: 600;
            color: #ffffff;
        }

        ::placeholder {
            color: #888888;
            font-family: 'Poppins', sans-serif;
            font-size: 16px;
        }

        .output {
            margin-top: 20px;
            padding: 15px;
            background-color: #121212;
            border-radius: 24px;
            display: none;
            font-size: 16px;
            color: #ffffff;
            text-align: left;
            transition: opacity 0.3s;
            overflow: auto;
        }

        .output p {
            margin: 8px 0;
            white-space: nowrap;
        }

        .spinner {
            border: 4px solid #333333;
            border-top: 4px solid #ffffff;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 0.5s linear infinite;
            margin: 20px auto;
            display: none;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .status-message {
            color: #ffffff;
            font-size: 14px;
            margin-top: 10px;
            display: none;
            transition: opacity 0.5s ease;
        }

        .account-count {
            color: #888888;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Roblox Alt Generator</h1>
        <input type="text" id="usernameInput" placeholder="Enter Username of New Account" onkeydown="handleKeyPress(event)" />
        <input type="text" id="altUsernameInput" placeholder="Add Alt without Generating" onkeydown="handleAltKeyPress(event)" />
        <div class="spinner" id="spinner"></div>
        <div class="status-message" id="statusMessage">Added</div>
        <div class="output" id="output"></div>
        <div class="account-count" id="accountCount">Account Count: 0</div>
    </div>

<script>
    document.getElementById('usernameInput').addEventListener('input', () => {
        generateAlt();
    });

    document.getElementById('altUsernameInput').addEventListener('input', () => {
        addAlt();
    });

    async function generateAlt() {
        const username = document.getElementById('usernameInput').value.trim();
        const output = document.getElementById('output');
        const spinner = document.getElementById('spinner');

        if (!username) {
            output.textContent = 'Please enter a username';
            output.style.display = 'block';
            return;
        }

        spinner.style.display = 'block';
        output.style.display = 'none';

        try {
            const response = await fetch('/generate-alt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (response.ok) {
                setTimeout(() => {
                    spinner.style.display = 'none';
                    while (output.firstChild) {
                        output.removeChild(output.firstChild);
                    }
                    const usernamePara = document.createElement('p');
                    usernamePara.innerHTML = "<i class='fas fa-user'></i> " + data.username;
                    const passwordPara = document.createElement('p');
                    passwordPara.innerHTML = "<i class='fas fa-lock'></i> " + data.password;
                    const datePara = document.createElement('p');
                    datePara.innerHTML = "<i class='fas fa-calendar-alt'></i> " + data.date;
                    output.appendChild(usernamePara);
                    output.appendChild(passwordPara);
                    output.appendChild(datePara);

                    output.style.display = 'block';
                }, 500);
            } else {
                spinner.style.display = 'none';
                output.textContent = data.error;
                output.style.display = 'block';
            }
        } catch (error) {
            spinner.style.display = 'none';
            output.textContent = 'An error occurred. Please try again later.';
            output.style.display = 'block';
        }
    }

    async function addAlt() {
        const username = document.getElementById('altUsernameInput').value.trim();
        const spinner = document.getElementById('spinner');
        const statusMessage = document.getElementById('statusMessage');

        if (!username) {
            return;
        }

        spinner.style.display = 'block';
        statusMessage.style.display = 'none';

        try {
            await fetch('/add-alt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            document.getElementById('altUsernameInput').value = '';

            setTimeout(() => {
                spinner.style.display = 'none';
                statusMessage.textContent = \`\${username}\`;
                statusMessage.style.display = 'block';
                statusMessage.style.opacity = '1';

                setTimeout(() => {
                    statusMessage.style.opacity = '0';
                    setTimeout(() => {
                        statusMessage.style.display = 'none';
                    }, 500);
                }, 500);
            }, 500);
        } catch (error) {
            spinner.style.display = 'none';
            console.error('Failed to add alt:', error);
        }
    }

    async function updateAccountCount() {
        try {
            const response = await fetch('/count');
            const data = await response.json();
            const accountCount = document.getElementById('accountCount');
            accountCount.textContent = \`Account Count: \${data.count}\`;
        } catch (error) {
            console.error('Failed to update account count:', error);
        }
    }

    setInterval(updateAccountCount, 500);
</script>
</body>
</html>
    `);
});


app.listen(PORT, () => {
    logAction('Server Started', `Server is running on http://localhost:${PORT}`);
});

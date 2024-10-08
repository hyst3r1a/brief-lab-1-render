const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;

// Database setup
const db = new sqlite3.Database('./brief_data.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS briefs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            contact_person TEXT,
            position TEXT,
            phone TEXT,
            email TEXT,
            project_name TEXT,
            project_type TEXT,
            project_goals TEXT
        )`);
    }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files

// Serve the form page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle form submissions
app.post('/submit', (req, res) => {
    const {
        'company-name': companyName,
        'contact-person': contactPerson,
        position,
        phone,
        email,
        'project-name': projectName,
        'project-type': projectType,
        'project-goals': projectGoals
    } = req.body;

    // Insert form data into the database
    db.run(
        `INSERT INTO briefs (
            company_name, contact_person, position, phone, email, project_name, project_type, project_goals
        ) VALUES (?,?,?,?,?,?,?,?)`,
        [companyName, contactPerson, position, phone, email, projectName, projectType, projectGoals],
        (err) => {
            if (err) {
                console.error(err.message);
                res.send('Error saving data.');
            } else {
                res.redirect('/getall'); // Redirect to the display page after submission
            }
        }
    );
});

// Serve the getall page
app.get('/getall', (req, res) => {
    db.all(`SELECT * FROM briefs`, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.send('Error retrieving data.');
        } else {
            let html = `
                <html>
                <head>
                    <title>All Submissions</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>All Submissions</h1>
                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Company Name</th>
                            <th>Contact Person</th>
                            <th>Position</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Project Name</th>
                            <th>Project Type</th>
                            <th>Project Goals</th>
                        </tr>`;
            
            // Add a table row for each submission
            rows.forEach((row) => {
                html += `
                    <tr>
                        <td>${row.id}</td>
                        <td>${row.company_name}</td>
                        <td>${row.contact_person}</td>
                        <td>${row.position}</td>
                        <td>${row.phone}</td>
                        <td>${row.email}</td>
                        <td>${row.project_name}</td>
                        <td>${row.project_type}</td>
                        <td>${row.project_goals}</td>
                    </tr>`;
            });

            html += `
                    </table>
                    <br>
                    <a href="/">Go back to the form</a>
                </body>
                </html>`;
            
            res.send(html);
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

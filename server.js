const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;
const { Database } = require('@sqlitecloud/drivers');

// Use environment variable for admin password
const ADMIN_PASS = process.env.ADMIN_PASS || 'defaultpassword';
const DB_CONN = process.env.DB_CONN;

// Function to escape HTML special characters to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, (match) => {
        switch (match) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return match;
        }
    });
}

// Database setup
const db = new Database(DB_CONN, err => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        db.run(`USE DATABASE chinook.sqlite;
            CREATE TABLE IF NOT EXISTS briefs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            contact_person TEXT,
            position TEXT,
            phone TEXT,
            email TEXT,
            project_name TEXT,
            project_type TEXT,
            project_goals TEXT,
            audience_characteristics TEXT,
            audience_needs TEXT,
            competitors TEXT,
            differentiators TEXT,
            advantages TEXT,
            budget TEXT,
            budget_constraints TEXT,
            project_timeline TEXT,
            milestones TEXT
        )`);
    }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files

// Serve the form page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index2.html'));
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
        'project-goals': projectGoals,
        'audience-characteristics': audienceCharacteristics,
        'audience-needs': audienceNeeds,
        competitors,
        differentiators,
        advantages,
        budget,
        'budget-constraints': budgetConstraints,
        'project-timeline': projectTimeline,
        milestones
    } = req.body;

    // Insert form data into the database
    db.run(
        `USE DATABASE chinook.sqlite;
        INSERT INTO briefs (
            company_name, contact_person, position, phone, email, project_name, project_type, project_goals,
            audience_characteristics, audience_needs, competitors, differentiators, advantages, 
            budget, budget_constraints, project_timeline, milestones
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [companyName, contactPerson, position, phone, email, projectName, projectType, projectGoals, audienceCharacteristics,
         audienceNeeds, competitors, differentiators, advantages, budget, budgetConstraints, projectTimeline, milestones],
        (err) => {
            if (err) {
                console.error(err.message);
                res.send('Error saving data.');
            } else {
                res.redirect('/'); // Redirect back to the form after submission
            }
        }
    );
});

// Admin route with password check
app.get('/admin', (req, res) => {
    const password = req.query.password;

    if (password === ADMIN_PASS) {
        // If password matches, display all submissions
        db.all(`USE DATABASE chinook.sqlite;
            SELECT * FROM briefs`, [], (err, rows) => {
            if (err) {
                console.error(err.message);
                res.send('Error retrieving data.');
            } else {
                let html = `
                    <html>
                    <head>
                        <title>Admin - All Submissions</title>
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
                                <th>Audience Characteristics</th>
                                <th>Audience Needs</th>
                                <th>Competitors</th>
                                <th>Differentiators</th>
                                <th>Advantages</th>
                                <th>Budget</th>
                                <th>Budget Constraints</th>
                                <th>Timeline</th>
                                <th>Milestones</th>
                            </tr>`;
                
                // Add a table row for each submission, escaping all dynamic content
                rows.forEach((row) => {
                    html += `
                        <tr>
                            <td>${escapeHtml(row.id.toString())}</td>
                            <td>${escapeHtml(row.company_name)}</td>
                            <td>${escapeHtml(row.contact_person)}</td>
                            <td>${escapeHtml(row.position)}</td>
                            <td>${escapeHtml(row.phone)}</td>
                            <td>${escapeHtml(row.email)}</td>
                            <td>${escapeHtml(row.project_name)}</td>
                            <td>${escapeHtml(row.project_type)}</td>
                            <td>${escapeHtml(row.project_goals)}</td>
                            <td>${escapeHtml(row.audience_characteristics)}</td>
                            <td>${escapeHtml(row.audience_needs)}</td>
                            <td>${escapeHtml(row.competitors)}</td>
                            <td>${escapeHtml(row.differentiators)}</td>
                            <td>${escapeHtml(row.advantages)}</td>
                            <td>${escapeHtml(row.budget)}</td>
                            <td>${escapeHtml(row.budget_constraints)}</td>
                            <td>${escapeHtml(row.project_timeline)}</td>
                            <td>${escapeHtml(row.milestones)}</td>
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
    } else {
        // If password is incorrect, show error
        res.send('<h1>Access Denied: Incorrect password</h1>');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

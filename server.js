const express = require('express');
const multer = require('multer');
const csv = require('csvtojson');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
const upload = multer({ dest: 'uploads/' });

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY
}));

async function analyzeTransactions(deposits, withdrawals) {
    let report = "";
    if (!deposits.some(tx => 'Amount' in tx) || !withdrawals.some(tx => 'Amount' in tx)) {
        return "⚠️ Invalid file format. Missing 'Amount' column.";
    }
    deposits = deposits.map(tx => ({ ...tx, Amount: parseFloat(tx.Amount.replace(',', '')) }));
    withdrawals = withdrawals.map(tx => ({ ...tx, Amount: parseFloat(tx.Amount.replace(',', '')) }));
    const thresholdDeposit = deposits.sort((a, b) => a.Amount - b.Amount)[Math.floor(deposits.length * 0.95)].Amount;
    const thresholdWithdrawal = withdrawals.sort((a, b) => a.Amount - b.Amount)[Math.floor(withdrawals.length * 0.95)].Amount;
    const largeDeposits = deposits.filter(tx => tx.Amount > thresholdDeposit);
    const largeWithdrawals = withdrawals.filter(tx => tx.Amount > thresholdWithdrawal);
    if (largeDeposits.length) report += `⚠️ Large Deposits: ${largeDeposits.length}\n`;
    if (largeWithdrawals.length) report += `⚠️ Large Withdrawals: ${largeWithdrawals.length}\n`;
    return report || "✅ No anomalies detected.";
}

app.post('/upload', upload.fields([{ name: 'deposits' }, { name: 'withdrawals' }]), async (req, res) => {
    if (!req.files.deposits || !req.files.withdrawals) {
        return res.status(400).json({ error: "Please upload both deposit and withdrawal files." });
    }
    try {
        const deposits = await csv().fromFile(req.files.deposits[0].path);
        const withdrawals = await csv().fromFile(req.files.withdrawals[0].path);
        fs.unlinkSync(req.files.deposits[0].path);
        fs.unlinkSync(req.files.withdrawals[0].path);
        const analysis = await analyzeTransactions(deposits, withdrawals);
        res.json({
            total_deposits: deposits.length,
            total_withdrawals: withdrawals.length,
            analysis
        });
    } catch (error) {
        res.status(500).json({ error: `File processing error: ${error.message}` });
    }
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: "No message received." });
    }
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a financial assistant analyzing transactions." },
                { role: "user", content: userMessage }
            ]
        });
        res.json({ response: response.data.choices[0].message.content.trim() });
    } catch (error) {
        res.status(500).json({ error: `Chat request failed: ${error.message}` });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
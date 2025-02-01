from flask import Flask, request, render_template, jsonify
import pandas as pd
import numpy as np
import openai
import os

app = Flask(__name__)

# Set your OpenAI API key
OPENAI_API_KEY = os.getenv("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")
openai.api_key = OPENAI_API_KEY

def analyze_transactions(deposits_df, withdrawals_df):
    report = ""
    if "Amount" not in deposits_df.columns or "Amount" not in withdrawals_df.columns:
        return "⚠️ Invalid file format. Missing 'Amount' column."
    
    deposits_df["Amount"] = pd.to_numeric(deposits_df["Amount"], errors='coerce')
    withdrawals_df["Amount"] = pd.to_numeric(withdrawals_df["Amount"], errors='coerce')
    
    large_deposits = deposits_df[deposits_df["Amount"] > deposits_df["Amount"].quantile(0.95)]
    large_withdrawals = withdrawals_df[withdrawals_df["Amount"] > withdrawals_df["Amount"].quantile(0.95)]
    
    if not large_deposits.empty:
        report += f"⚠️ Large Deposits Detected: {len(large_deposits)} transactions\n"
    if not large_withdrawals.empty:
        report += f"⚠️ Large Withdrawals Detected: {len(large_withdrawals)} transactions\n"
    
    return report or "✅ No anomalies detected."

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'deposits' not in request.files or 'withdrawals' not in request.files:
        return jsonify({"error": "Please upload both deposit and withdrawal files."})
    
    deposits_file = request.files['deposits']
    withdrawals_file = request.files['withdrawals']
    
    try:
        deposits_df = pd.read_csv(deposits_file)
        withdrawals_df = pd.read_csv(withdrawals_file)
    except Exception as e:
        return jsonify({"error": f"File processing error: {str(e)}"})
    
    if "Time of withdrawal" not in withdrawals_df.columns:
        return jsonify({"error": "Invalid file format. Missing 'Time of withdrawal' column."})
    
    withdrawals_df["Time of withdrawal"] = pd.to_datetime(withdrawals_df["Time of withdrawal"], errors='coerce')
    latest_date = withdrawals_df["Time of withdrawal"].max()
    analysis = analyze_transactions(deposits_df, withdrawals_df)
    
    report = {
        "date": str(latest_date),
        "total_deposits": len(deposits_df),
        "total_withdrawals": len(withdrawals_df),
        "analysis": analysis
    }
    
    return jsonify(report)

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get("message", "")
    if not user_message:
        return jsonify({"error": "No message received."})
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a financial assistant analyzing transactions."},
                {"role": "user", "content": user_message}
            ]
        )
        reply_text = response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return jsonify({"error": f"Chat request failed: {str(e)}"})
    
    return jsonify({"response": reply_text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

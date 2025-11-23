import React, { useState } from 'react';
import { evaluateWriting } from '../services/geminiService';
import { TestResult } from '../types';
import { Loader2 } from 'lucide-react';

interface FeedbackInputProps {
    onAnalyze: (result: TestResult) => void;
}

const FeedbackInput: React.FC<FeedbackInputProps> = ({ onAnalyze }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            // Create a dummy prompt wrapper since evaluateWriting expects one
            const dummyPrompt = {
                title: "User Submitted Text",
                instructions: "Analyze this text as an IELTS Task 2 Essay or General Writing.",
            };
            const result = await evaluateWriting(dummyPrompt, text);
            onAnalyze(result);
        } catch (e) {
            alert("Analysis failed.");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Instant Feedback</h2>
            <p className="text-slate-500 mb-6">Paste your essay or transcript below to get an instant band score calculation.</p>
            
            <textarea
                className="w-full h-64 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-4 shadow-sm"
                placeholder="Paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            
            <button
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex justify-center items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : "Analyze Text"}
            </button>
        </div>
    );
};

export default FeedbackInput;

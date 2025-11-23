import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PracticeMode: React.FC = () => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    
    const generate = async () => {
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: "Generate 5 unique, challenging IELTS Speaking Part 3 questions and 2 Writing Task 2 topics. Format nicely in Markdown."
            });
            setContent(response.text || '');
        } catch (e) {
            setContent("Error generating content. Please try again.");
        }
        setLoading(false);
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Practice Bank</h2>
                <button 
                    onClick={generate}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    Generate New
                </button>
            </div>
            
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
                {content ? (
                    <div className="prose prose-slate max-w-none">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <p>Click generate to get practice questions.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeMode;

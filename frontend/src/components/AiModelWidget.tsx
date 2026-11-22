import React, { useState } from 'react';
import { apiRequest } from '../api/client';

export const AiModelWidget: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<any>('/predict', {
        method: 'POST',
        body: JSON.stringify({ prompt: input }),
        headers: { 'Content-Type': 'application/json' },
      });
      setResponse(data.output);
    } catch (err: any) {
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">AI Assistant</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full p-2 border rounded"
          rows={4}
          placeholder="Ask something…"
          value={input}
          onChange={e => setInput(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Thinking…' : 'Send'}
        </button>
      </form>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      {response && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-medium mb-2">Response</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

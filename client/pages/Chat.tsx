import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const msg = input;
    setInput('');

    // Add user message
    setMessages(m => [...m, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg })
      });

      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: '❌ Erreur serveur' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="mb-6 inline-block">
          <Button variant="outline">← Accueil</Button>
        </Link>

        <div className="bg-white rounded-lg border border-border shadow-lg overflow-hidden flex flex-col h-96">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4">
            <h1 className="text-xl font-bold">Baymora</h1>
            <p className="text-sm text-white/90">Votre assistant de voyage</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-muted-foreground">✨ Parlez à Baymora de votre voyage</p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white border border-border'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-border px-4 py-2 rounded-lg">
                      <p className="text-sm text-muted-foreground">Baymora écrit...</p>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border bg-white p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Votre message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && send()}
                disabled={loading}
              />
              <Button onClick={send} disabled={loading || !input.trim()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

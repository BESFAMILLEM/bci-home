import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Edit3,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { processUserChatMessage } from '../../utils/chatbotEngine';
import {
  buildArchetypeSummaryText,
  formatCLP,
  formatUF,
} from '../../utils/financialEngine';

interface ArchetypeChatbotProps {
  onSwitchToTags: () => void;
  onRequestSaveArchetype: () => void;
}

export const ArchetypeChatbot: React.FC<ArchetypeChatbotProps> = ({
  onSwitchToTags,
  onRequestSaveArchetype,
}) => {
  const {
    chatMessages,
    addChatMessage,
    archetype,
    metrics,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatMessages.length]);

  const handleSendMessage = (textToProcess: string) => {
    const trimmed = textToProcess.trim();
    if (!trimmed) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user' as const,
      text: trimmed,
      timestamp: 'Ahora',
    };

    const turnResult = processUserChatMessage(trimmed, archetype);

    addChatMessage(userMsg, turnResult.updatedArchetype);
    setInputText('');

    window.setTimeout(() => {
      addChatMessage(
        {
          id: `agent-${Date.now() + 1}`,
          sender: 'agent',
          text: turnResult.agentReply,
          timestamp: 'Ahora',
          detectedUpdates: turnResult.detectedUpdates,
          suggestions: turnResult.suggestions,
        },
        turnResult.updatedArchetype
      );
    }, 260);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Seguir guía `forms`: verificar isComposing antes de tratar Enter como submit
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const indispensableTags = archetype.tags.filter(
    (t) => t.priority === 'indispensable'
  );
  const desirableTags = archetype.tags.filter(
    (t) => t.priority !== 'indispensable'
  );

  const lastAgentMessage = [...chatMessages]
    .reverse()
    .find((m) => m.sender === 'agent');

  return (
    <div className="space-y-4">
      {/* Cabecera del asistente conversacional */}
      <div className="rounded-2xl bg-[var(--blue-20)] border border-[var(--blue-40)] p-3.5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--blue-normal)] text-white flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--gray-dark)]">
            Asesor Conversacional Bci
          </p>
          <p className="text-xs text-[var(--gray-semidark)] leading-relaxed">
            Cuéntanos con tus palabras cómo imaginas tu vivienda (ej.{' '}
            <em>&ldquo;Quiero una casa en La Florida de 3 dormitorios con patio preferible&rdquo;</em>).
          </p>
        </div>
      </div>

      {/* Ventana de conversación */}
      <div className="rounded-2xl border border-[var(--gray-semilight)] bg-[var(--gray-light)] p-3.5 max-h-[340px] overflow-y-auto space-y-3">
        {chatMessages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isAgent ? 'items-start' : 'items-end'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isAgent
                    ? 'bg-white border border-[var(--gray-semilight)] text-[var(--gray-dark)] rounded-tl-sm'
                    : 'bg-[var(--green-dark)] text-white rounded-tr-sm font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-xs opacity-80 font-semibold">
                  {isAgent ? (
                    <>
                      <Sparkles className="w-3 h-3 text-[var(--blue-normal)]" aria-hidden="true" />
                      <span>Asesor Bci</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3" aria-hidden="true" />
                      <span>Tú</span>
                    </>
                  )}
                </div>
                <p>{msg.text}</p>

                {/* Etiquetas detectadas en ese turno */}
                {msg.detectedUpdates && msg.detectedUpdates.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--gray-light)] flex flex-wrap gap-1">
                    {msg.detectedUpdates.map((upd, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--green-20)] text-[var(--green-dark)]"
                      >
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        {upd}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Respuestas sugeridas rápidas */}
      {lastAgentMessage?.suggestions &&
        lastAgentMessage.suggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[var(--gray-semidark)]">
              Respuestas sugeridas para probar rápido:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lastAgentMessage.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(suggestion)}
                  className="text-left text-xs font-medium px-3 py-2 rounded-xl bg-white border border-[var(--blue-40)] text-[var(--blue-dark)] hover:bg-[var(--blue-20)] transition-colors min-h-[40px]"
                >
                  &ldquo;{suggestion}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Formulario para enviar mensaje */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
        <label htmlFor="chat-user-input" className="visually-hidden">
          Escribe tus preferencias de vivienda
        </label>
        <input
          id="chat-user-input"
          name="chatMessage"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ej: Casa en La Florida, 3 dormitorios, patio preferible..."
          enterKeyHint="send"
          className="bci-input flex-1"
        />
        <button
          type="submit"
          aria-label="Enviar mensaje al asesor"
          className="bci-btn-primary shrink-0 !px-4"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>

      {/* Resumen final interactivo del chatbot (Sección 6) */}
      <div className="rounded-2xl bg-white border border-[var(--gray-semilight)] p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--gray-dark)]">
            Resumen de lo que hemos entendido
          </h3>
          <span className="text-xs font-semibold text-[var(--blue-dark)] bg-[var(--blue-20)] px-2.5 py-0.5 rounded-full">
            Sincronizado
          </span>
        </div>

        <p className="text-xs text-[var(--gray-semidark)] leading-relaxed">
          {buildArchetypeSummaryText(archetype)}
        </p>

        <div className="grid grid-cols-2 gap-2 bg-[var(--gray-light)] rounded-xl p-2.5 text-xs">
          <div>
            <span className="text-[var(--gray-semidark)] block">
              Tipo y sector
            </span>
            <span className="font-bold text-[var(--gray-dark)] capitalize">
              {archetype.propertyType || 'Abierto'} ·{' '}
              {archetype.communes.join(', ') || archetype.region}
            </span>
          </div>
          <div>
            <span className="text-[var(--gray-semidark)] block">
              Valor ref. / Pie (20%)
            </span>
            <span className="font-bold text-[var(--green-dark)]">
              {formatUF(metrics.propertyEstimatedPriceUF)} /{' '}
              {formatCLP(metrics.downPaymentTargetCLP)}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <span className="font-semibold text-[var(--gray-dark)] block mb-1">
              Condiciones imprescindibles ({indispensableTags.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {indispensableTags.map((t) => (
                <span
                  key={t.id}
                  className="px-2.5 py-1 rounded-lg bg-[var(--green-20)] text-[var(--green-dark)] font-semibold border border-[var(--green-40)]"
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {desirableTags.length > 0 && (
            <div>
              <span className="font-semibold text-[var(--gray-dark)] block mb-1">
                Preferencias deseadas ({desirableTags.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {desirableTags.map((t) => (
                  <span
                    key={t.id}
                    className="px-2.5 py-1 rounded-lg bg-[var(--blue-20)] text-[var(--blue-dark)] font-medium border border-[var(--blue-40)]"
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRequestSaveArchetype}
            className="bci-btn-primary w-full"
          >
            Guardar mi casa ideal
          </button>
          <button
            type="button"
            onClick={onSwitchToTags}
            className="bci-btn-secondary w-full"
          >
            <Edit3 className="w-4 h-4" aria-hidden="true" />
            <span>Volver al paso a paso</span>
          </button>
        </div>
      </div>
    </div>
  );
};


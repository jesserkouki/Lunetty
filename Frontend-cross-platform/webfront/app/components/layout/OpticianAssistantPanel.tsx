"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  opticianAssistantService,
  type OpticianAssistantMessage,
  type OpticianAssistantProposal,
} from "../../../services/optician-assistant.service";
import { IconSparkles, IconX } from "../ui/Icons";

interface DisplayMessage extends OpticianAssistantMessage {
  id: number;
}

interface ProposalState extends OpticianAssistantProposal {
  status?: "confirmed";
}

export function OpticianAssistantPanel({
  open,
  storeId,
  storeName,
  onClose,
}: {
  open: boolean;
  storeId: string;
  storeName: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 0,
      role: "assistant",
      content:
        "Bonjour, je suis Lunetty Pro. Je peux vous aider à consulter le stock, les commandes, les rendez-vous et les indicateurs autorisés de votre boutique.",
    },
  ]);
  const [proposals, setProposals] = useState<ProposalState[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmingToken, setConfirmingToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(1);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, proposals, sending]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    if (!storeId) {
      setError("Aucune boutique active n’est sélectionnée.");
      return;
    }

    const userMessage: DisplayMessage = {
      id: nextMessageId.current++,
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMessage].slice(-20);
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setSending(true);
    try {
      const result = await opticianAssistantService.chat(storeId, nextMessages);
      const assistantMessage: DisplayMessage = {
        id: nextMessageId.current++,
        role: "assistant",
        content: result.reply,
      };
      setMessages((current) =>
        [...current, assistantMessage].slice(-20),
      );
      if (result.proposals.length) {
        setProposals((current) => [...current, ...result.proposals]);
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de joindre Lunetty Pro.",
      );
    } finally {
      setSending(false);
    }
  }

  async function confirmProposal(proposal: ProposalState) {
    if (!storeId || confirmingToken) return;
    setConfirmingToken(proposal.token);
    setError("");
    try {
      await opticianAssistantService.confirm(storeId, proposal.token);
      setProposals((current) =>
        current.map((item) =>
          item.token === proposal.token
            ? { ...item, status: "confirmed" }
            : item,
        ),
      );
      const confirmationMessage: DisplayMessage = {
        id: nextMessageId.current++,
        role: "assistant",
        content: "La proposition a été confirmée et appliquée.",
      };
      setMessages((current) =>
        [...current, confirmationMessage].slice(-20),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "La proposition n’a pas pu être appliquée.",
      );
    } finally {
      setConfirmingToken(null);
    }
  }

  return (
    <section
      className={`chatbot-panel opt-chatbot-card${open ? " chatbot-panel-open" : ""}`}
      aria-label="Conversation avec Lunetty Pro"
      aria-hidden={!open}
      inert={!open}
      role="dialog"
    >
      <div className="opt-chatbot-head">
        <div className="opt-icon-bubble gold">
          <IconSparkles height={18} width={18} />
        </div>
        <div className="opt-chatbot-title">
          <h3>Lunetty Pro</h3>
          <p className="opt-chatbot-sub">
            Assistant boutique · {storeName}
          </p>
        </div>
        <button
          className="opt-chatbot-close"
          onClick={onClose}
          type="button"
          aria-label="Fermer l’assistant"
          tabIndex={open ? 0 : -1}
        >
          <IconX height={18} width={18} />
        </button>
      </div>

      <div
        className="opt-chatbot-body opt-chatbot-transcript"
        ref={transcriptRef}
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            className={`opt-chat-message opt-chat-message-${message.role}`}
            key={message.id}
          >
            <span className="opt-chat-message-label">
              {message.role === "user" ? "Vous" : "Lunetty Pro"}
            </span>
            <p>{message.content}</p>
          </div>
        ))}
        {proposals.map((proposal) => (
          <div className="opt-chat-proposal" key={proposal.token}>
            <span className="opt-chat-proposal-eyebrow">
              {proposal.status === "confirmed"
                ? "ACTION CONFIRMÉE"
                : "PROPOSITION À CONFIRMER"}
            </span>
            <strong>{proposal.label}</strong>
            <span>
              {proposal.type === "stock_adjustment"
                ? `Quantité : ${proposal.from} → ${proposal.to}`
                : `Statut : ${proposal.from} → ${proposal.to}`}
            </span>
            <p>{proposal.reason}</p>
            {proposal.status !== "confirmed" && (
              <button
                className="button primary opt-chat-confirm"
                disabled={confirmingToken !== null}
                onClick={() => void confirmProposal(proposal)}
                type="button"
              >
                {confirmingToken === proposal.token
                  ? "Application…"
                  : "Confirmer l’action"}
              </button>
            )}
          </div>
        ))}
        {sending && (
          <p className="opt-chat-loading">Lunetty Pro consulte les données…</p>
        )}
      </div>

      {error && (
        <p className="opt-chat-error" role="alert">
          {error}
        </p>
      )}

      <form className="opt-chatbot-composer" onSubmit={sendMessage}>
        <input
          aria-label="Message à Lunetty Pro"
          autoComplete="off"
          disabled={sending || !storeId}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            storeId
              ? "Stock, commandes, rendez-vous…"
              : "Sélectionnez une boutique"
          }
          tabIndex={open ? 0 : -1}
          value={draft}
        />
        <button
          type="submit"
          disabled={sending || !storeId || !draft.trim()}
          aria-label="Envoyer le message"
        >
          <IconSparkles height={16} width={16} />
        </button>
      </form>
    </section>
  );
}

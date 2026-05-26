import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Send, ArrowLeft, MessageSquare, Flag, Check, X, UserPlus, CheckCheck, Paperclip, Mic, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import {
  listAcceptedConnections,
  listIncomingRequests,
  acceptConnection,
  removeConnection,
  partnerOf,
} from "@/lib/connection-service";
import { fetchProfileById, fetchProfileByUsername } from "@/lib/profile-service";
import {
  hasE2EELocalKey,
  generateE2EEKeyPair,
  encryptText,
  decryptText,
  encryptFile,
  decryptFile,
} from "@/lib/e2ee-service";
import type { ConnectionWithProfiles } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const MAX_MESSAGE_LENGTH = 4000;

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  is_encrypted?: boolean;
  encryption_iv?: string | null;
  attachment_url?: string | null;
  attachment_type?: "image" | "pdf" | "voice" | null;
  attachment_name?: string | null;
  attachment_iv?: string | null;
  attachment_key?: string | null;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerUsername: string;
  partnerAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  hasMessages: boolean;
  partnerPublicKey?: string;
}

function buildConversations(
  connections: ConnectionWithProfiles[],
  messages: Message[],
  myId: string
): Conversation[] {
  const map = new Map<string, Conversation>();

  // Seed from accepted connections so we can start a chat even with no history.
  for (const conn of connections) {
    const partner = partnerOf(myId, conn);
    if (!partner) continue;
    map.set(partner.id, {
      partnerId: partner.id,
      partnerName: partner.full_name || partner.username || "Utilisateur",
      partnerUsername: partner.username || "",
      partnerAvatar: partner.avatar_url || "",
      lastMessage: "",
      lastMessageAt: conn.updated_at,
      unread: 0,
      hasMessages: false,
      partnerPublicKey: partner.e2ee_public_key || undefined,
    });
  }

  // Overlay message history (messages must be sorted newest-first).
  for (const msg of messages) {
    const isSent = msg.sender_id === myId;
    const partnerId = isSent ? msg.receiver_id : msg.sender_id;
    let conv = map.get(partnerId);
    if (!conv) {
      conv = {
        partnerId,
        partnerName: "Utilisateur",
        partnerUsername: "",
        partnerAvatar: "",
        lastMessage: "",
        lastMessageAt: msg.created_at,
        unread: 0,
        hasMessages: false,
      };
      map.set(partnerId, conv);
    }
    if (!conv.hasMessages) {
      conv.hasMessages = true;
      conv.lastMessage = msg.content;
      conv.lastMessageAt = msg.created_at;
    }
    if (!isSent && !msg.read_at) conv.unread++;
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

interface AttachmentRendererProps {
  message: Message;
  partnerPublicKey?: string;
}

function AttachmentRenderer({ message, partnerPublicKey }: AttachmentRendererProps) {
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!message.attachment_url) return;
    
    // If it's not encrypted, we can just use the public url directly!
    if (!message.attachment_key || !partnerPublicKey) {
      setDecryptedUrl(message.attachment_url);
      return;
    }

    let active = true;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const res = await fetch(message.attachment_url!);
        if (!res.ok) throw new Error("Téléchargement échoué");
        const encryptedBlob = await res.blob();
        
        let mime = "application/octet-stream";
        if (message.attachment_type === "image") {
          mime = "image/jpeg";
        } else if (message.attachment_type === "pdf") {
          mime = "application/pdf";
        } else if (message.attachment_type === "voice") {
          mime = "audio/webm";
        }

        const decrypted = await decryptFile(
          encryptedBlob,
          partnerPublicKey,
          message.attachment_iv!,
          message.attachment_key!,
          mime
        );
        
        if (active) {
          const url = URL.createObjectURL(decrypted);
          setDecryptedUrl(url);
        }
      } catch (err) {
        console.warn("Échec de déchiffrement de la pièce jointe", err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (decryptedUrl && decryptedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(decryptedUrl);
      }
    };
  }, [message.attachment_url, message.attachment_key, partnerPublicKey]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/3 p-3 text-xs text-muted-foreground mt-1.5">
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
        Déchiffrement sécurisé du fichier...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive mt-1.5">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Échec de déchiffrement de la pièce jointe
      </div>
    );
  }

  if (!decryptedUrl) return null;

  if (message.attachment_type === "image") {
    return (
      <div className="relative mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-black/20 max-w-[280px]">
        <img
          src={decryptedUrl}
          alt={message.attachment_name || "Pièce jointe"}
          className="max-h-60 w-full object-cover rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
          onClick={() => window.open(decryptedUrl, "_blank")}
        />
      </div>
    );
  }

  if (message.attachment_type === "pdf") {
    return (
      <a
        href={decryptedUrl}
        download={message.attachment_name || "document.pdf"}
        className="flex items-center gap-3 mt-1.5 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/8 transition-colors max-w-[280px] text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
          <Paperclip className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{message.attachment_name}</p>
          <p className="text-[10px] text-muted-foreground">Document PDF chiffré</p>
        </div>
      </a>
    );
  }

  if (message.attachment_type === "voice") {
    return (
      <div className="mt-1.5 flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-2.5 min-w-[240px]">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary shrink-0 animate-pulse" />
          <span className="text-[11px] font-semibold text-foreground">Message vocal sécurisé</span>
        </div>
        <audio src={decryptedUrl} controls className="w-full mt-1.5 h-8 bg-transparent" />
      </div>
    );
  }

  return null;
}

export function MessagesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toParam = searchParams.get("to");
  const handledToRef = useRef<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [requests, setRequests] = useState<ConnectionWithProfiles[]>([]);
  const [connectedPartnerIds, setConnectedPartnerIds] = useState<string[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bisomap.last.active.chat");
    }
    return null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // States for audio recording and file uploads
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileTypeToSend, setFileTypeToSend] = useState<"image" | "pdf">("image");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAll();
  }, [user]);

  // Save selectedPartner in localStorage to persist the active conversation
  useEffect(() => {
    if (selectedPartner) {
      localStorage.setItem("bisomap.last.active.chat", selectedPartner);
    } else {
      localStorage.removeItem("bisomap.last.active.chat");
    }
  }, [selectedPartner]);

  // Auto-initialize E2EE cryptographic keys on login
  useEffect(() => {
    if (!user) return;
    
    (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("e2ee_public_key")
          .eq("id", user.id)
          .maybeSingle();

        const hasLocal = await hasE2EELocalKey();

        // If no local key exists OR if the profile doesn't have a public key, we generate a new pair!
        if (!hasLocal || !profile?.e2ee_public_key) {
          const { publicKeyJWK } = await generateE2EEKeyPair();
          await supabase
            .from("profiles")
            .update({ e2ee_public_key: publicKeyJWK })
            .eq("id", user.id);
          console.info("[E2EE] Clés initialisées avec succès.");
        }
      } catch (err) {
        console.warn("[E2EE] Échec de l'initialisation automatique :", err);
      }
    })();
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedPartner && user) {
      fetchMessages(selectedPartner);
      markAsRead(selectedPartner).then(() => {
        useAuthStore.getState().fetchUnreadMessages();
        setConversations((prev) =>
          prev.map((c) => (c.partnerId === selectedPartner ? { ...c, unread: 0 } : c))
        );
      });
    }
  }, [selectedPartner]);

  useEffect(() => {
    if (!user || !selectedPartner) return;
    const conv = conversations.find((c) => c.partnerId === selectedPartner);
    if (!conv || conv.partnerUsername) return;
    fetchProfileById(selectedPartner)
      .then((p) => {
        if (!p) return;
        setConversations((prev) =>
          prev.map((c) =>
            c.partnerId === selectedPartner
              ? {
                  ...c,
                  partnerName: p.full_name || p.username || c.partnerName,
                  partnerUsername: p.username || c.partnerUsername,
                  partnerAvatar: p.avatar_url || c.partnerAvatar,
                }
              : c
          )
        );
      })
      .catch(() => {});
  }, [user, selectedPartner, conversations]);

  // Deep-link from a profile: /messages?to=username (only for accepted connections).
  useEffect(() => {
    if (isLoading || !toParam || !user || handledToRef.current === toParam) return;
    handledToRef.current = toParam;

    (async () => {
      try {
        const target = await fetchProfileByUsername(toParam);
        if (!target) {
          toast.error("Profil introuvable.");
          return;
        }
        if (conversations.some((c) => c.partnerId === target.id)) {
          setSelectedPartner(target.id);
        } else {
          toast.error("Vous devez être connecté à ce membre pour lui écrire.");
          navigate(`/contributeurs/${toParam}`);
        }
      } catch {
        toast.error("Impossible d'ouvrir cette conversation.");
      } finally {
        searchParams.delete("to");
        setSearchParams(searchParams, { replace: true });
      }
    })();
  }, [isLoading, toParam, user, conversations]);

  // Supabase Realtime — live messages + connection changes
  useEffect(() => {
    if (!user) return;

    // Unique topic per subscription: supabase.channel() reuses a channel with
    // the same topic, and removeChannel() only detaches it asynchronously, so a
    // re-subscribe (deps change / remount) could hit an already-joined channel
    // and throw "cannot add postgres_changes callbacks after subscribe()".
    const topic = `messages-realtime-${user.id}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        async () => {
          await fetchAll();
          if (selectedPartner) {
            await fetchMessages(selectedPartner);
            markAsRead(selectedPartner);
          }
          useAuthStore.getState().fetchUnreadMessages();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections", filter: `requester_id=eq.${user.id}` },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections", filter: `addressee_id=eq.${user.id}` },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedPartner]);

  async function fetchAll() {
    if (!user) return;
    try {
      const [conns, msgsRes, reqs] = await Promise.all([
        listAcceptedConnections(user.id),
        supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false }),
        listIncomingRequests(user.id),
      ]);

      const rawMsgs = (msgsRes.data || []) as Message[];
      
      // Déchiffrer les messages de la barre latérale pour afficher les aperçus en clair.
      const decryptedMsgs = await Promise.all(
        rawMsgs.map(async (msg) => {
          if (!msg.is_encrypted) return msg;
          const isSent = msg.sender_id === user.id;
          const partnerId = isSent ? msg.receiver_id : msg.sender_id;
          const conn = conns.find((c) => partnerOf(user.id, c)?.id === partnerId);
          const partnerKey = conn ? partnerOf(user.id, conn)?.e2ee_public_key : null;
          
          if (partnerKey) {
            try {
              const plain = await decryptText(msg.content, partnerKey, msg.encryption_iv!);
              return { ...msg, content: plain };
            } catch {
              return { ...msg, content: "🔒 [Message chiffré]" };
            }
          }
          return { ...msg, content: "🔒 [Message chiffré]" };
        })
      );

      setConversations(buildConversations(conns, decryptedMsgs, user.id));
      setRequests(reqs);
      setConnectedPartnerIds(
        conns
          .map((c) => partnerOf(user.id, c)?.id)
          .filter((id): id is string => Boolean(id))
      );
      useAuthStore.getState().fetchPendingRequests();
    } catch (err) {
      console.warn("fetchAll (messages) failed:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMessages(partnerId: string) {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    
    const rawMsgs = (data || []) as Message[];
    const conv = conversations.find((c) => c.partnerId === partnerId);
    
    if (conv?.partnerPublicKey) {
      const decMsgs = await Promise.all(
        rawMsgs.map(async (msg) => {
          if (!msg.is_encrypted) return msg;
          try {
            const plain = await decryptText(msg.content, conv.partnerPublicKey!, msg.encryption_iv!);
            return { ...msg, content: plain };
          } catch {
            return { ...msg, content: "🔒 [Message chiffré - Clé indisponible]" };
          }
        })
      );
      setMessages(decMsgs);
    } else {
      setMessages(rawMsgs);
    }
  }

  async function markAsRead(partnerId: string) {
    if (!user) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", partnerId)
      .eq("receiver_id", user.id)
      .is("read_at", null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !selectedPartner || !user) return;
    if (!connectedPartnerIds.includes(selectedPartner)) {
      toast.error("Vous devez être connecté à ce membre pour répondre.");
      return;
    }
    setIsSending(true);

    const conv = conversations.find((c) => c.partnerId === selectedPartner);
    const payload: Partial<Message> = {
      sender_id: user.id,
      receiver_id: selectedPartner,
    };

    if (conv?.partnerPublicKey) {
      try {
        const { cipherText, iv } = await encryptText(content, conv.partnerPublicKey);
        payload.content = cipherText;
        payload.is_encrypted = true;
        payload.encryption_iv = iv;
      } catch (err) {
        toast.error("Échec du chiffrement du message.");
        setIsSending(false);
        return;
      }
    } else {
      payload.content = content;
      payload.is_encrypted = false;
    }

    const { error } = await supabase.from("messages").insert(payload);
    if (error) {
      const msg = error.message || "Erreur lors de l'envoi du message";
      if (/row level security|rls/i.test(msg)) {
        toast.error("Impossible d’envoyer : vous devez être connecté à ce membre.");
      } else {
        toast.error(msg);
      }
    } else {
      setNewMessage("");
      await fetchMessages(selectedPartner);

      // Fire-and-forget email notification (non-blocking).
      supabase.functions
        .invoke("send-message-notification", {
          body: { sender_id: user.id, receiver_id: selectedPartner, content: conv?.partnerPublicKey ? "🔒 [Message chiffré]" : content },
        })
        .catch((err) => console.error("Email notification error:", err));
    }
    setIsSending(false);
  }

  async function reportMessage(messageId: string) {
    if (!user || !selectedPartner) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      message_id: messageId,
      reported_id: selectedPartner,
      reason: "Contenu inapproprié signalé par l'utilisateur",
    });
    if (!error) {
      toast.success("Message signalé. Notre équipe examinera ce contenu.");
    }
  }

  async function respondToRequest(conn: ConnectionWithProfiles, accept: boolean) {
    try {
      if (accept) {
        await acceptConnection(conn.id);
        toast.success("Connexion acceptée");
      } else {
        await removeConnection(conn.id);
        toast.success("Demande refusée");
      }
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  }

  // Audio recording helpers
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "note-vocale.webm", { type: "audio/webm" });
        await sendAttachment(audioFile, "voice");
        
        stream.getTracks().forEach((track) => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error("Impossible d'accéder au microphone.");
    }
  }

  function stopRecording(cancel = false) {
    if (!mediaRecorder) return;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    if (cancel) {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
      return;
    }

    mediaRecorder.stop();
    setIsRecording(false);
    setMediaRecorder(null);
  }

  // File selection triggers
  function triggerFileSelect(type: "image" | "pdf") {
    setFileTypeToSend(type);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 10);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedPartner || !user) return;

    const limit = fileTypeToSend === "image" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > limit) {
      toast.error(`Fichier trop volumineux. Max ${fileTypeToSend === "image" ? "5 Mo" : "10 Mo"}.`);
      return;
    }

    await sendAttachment(file, fileTypeToSend);
    if (e.target) e.target.value = ""; // Reset
  }

  // Send Attachment (Photo, PDF, Voice Note) local encryption & Storage upload
  async function sendAttachment(file: File, type: "image" | "pdf" | "voice") {
    if (!selectedPartner || !user) return;
    setIsSending(true);

    const conv = conversations.find((c) => c.partnerId === selectedPartner);
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const path = `${user.id}/${Date.now()}_${cleanName}`;

    let uploadedUrl = "";
    let fileIv = "";
    let wrappedFileKey = "";

    try {
      if (conv?.partnerPublicKey) {
        toast.info("Chiffrement local de la pièce jointe...");
        const { encryptedBlob, fileIv: iv, wrappedFileKey: key } = await encryptFile(file, conv.partnerPublicKey);
        fileIv = iv;
        wrappedFileKey = key;

        const { error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(path, encryptedBlob, {
            contentType: "application/octet-stream",
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;
      } else {
        const { error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(path, file, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;
      }

      const { data: publicData } = supabase.storage
        .from("message-attachments")
        .getPublicUrl(path);

      if (!publicData?.publicUrl) {
        throw new Error("Impossible de générer l'URL de téléchargement.");
      }
      uploadedUrl = publicData.publicUrl;

      const payload: Partial<Message> = {
        sender_id: user.id,
        receiver_id: selectedPartner,
        attachment_url: uploadedUrl,
        attachment_type: type,
        attachment_name: file.name,
      };

      if (conv?.partnerPublicKey) {
        const { cipherText, iv } = await encryptText(`[Fichier joint: ${file.name}]`, conv.partnerPublicKey);
        payload.content = cipherText;
        payload.is_encrypted = true;
        payload.encryption_iv = iv;
        payload.attachment_iv = fileIv;
        payload.attachment_key = wrappedFileKey;
      } else {
        payload.content = `[Fichier joint: ${file.name}]`;
        payload.is_encrypted = false;
      }

      const { error: insertError } = await supabase.from("messages").insert(payload);
      if (insertError) throw insertError;

      toast.success("Pièce jointe envoyée !");
      await fetchMessages(selectedPartner);

      // Notify via edge function
      supabase.functions
        .invoke("send-message-notification", {
          body: { sender_id: user.id, receiver_id: selectedPartner, content: `[Pièce jointe: ${file.name}]` },
        })
        .catch(() => {});
    } catch (err) {
      console.error("sendAttachment failed:", err);
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setIsSending(false);
    }
  }

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-4 pb-24 md:pb-8">
        <Skeleton className="mb-5 h-9 w-40 rounded-xl" />
        <Skeleton className="h-[560px] rounded-2xl" />
      </div>
    );
  }

  const selectedConv = conversations.find((c) => c.partnerId === selectedPartner);
  const canReply = Boolean(selectedPartner && connectedPartnerIds.includes(selectedPartner));
  const lastSentMsg = messages.filter((m) => m.sender_id === user.id).at(-1);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          {requests.length > 0 && ` · ${requests.length} demande${requests.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="glass-panel grid h-[560px] overflow-hidden rounded-2xl border border-white/10 md:grid-cols-[300px_1fr]">

        {/* ── Conversations sidebar ── */}
        <div className={cn(
          "flex flex-col border-r border-white/8 h-full overflow-hidden",
          selectedPartner ? "hidden md:flex" : "flex"
        )}>
          <ScrollArea className="flex-1">
            {/* Incoming connection requests */}
            {requests.length > 0 && (
              <div className="border-b border-white/8 p-2">
                <p className="flex items-center gap-1.5 px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <UserPlus className="h-3.5 w-3.5" />
                  Demandes de connexion ({requests.length})
                </p>
                <div className="space-y-1">
                  {requests.map((req) => (
                    <div key={req.id} className="flex items-center gap-2 rounded-xl p-2">
                      <Avatar className="h-9 w-9 shrink-0 border border-white/10">
                        <AvatarImage src={req.requester?.avatar_url} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                          {(req.requester?.full_name || req.requester?.username || "U").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {req.requester?.full_name || req.requester?.username || "Utilisateur"}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          @{req.requester?.username}
                        </p>
                      </div>
                      <button
                        onClick={() => respondToRequest(req, true)}
                        title="Accepter"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => respondToRequest(req, false)}
                        title="Refuser"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-shrink-0 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conversations
              </p>
            </div>

            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground">Aucune conversation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Connectez-vous avec un membre depuis son profil pour discuter.
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedPartner(conv.partnerId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all",
                      selectedPartner === conv.partnerId
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={conv.partnerAvatar} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                          {conv.partnerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unread > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "truncate text-sm",
                        conv.unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground"
                      )}>
                        {conv.partnerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {conv.hasMessages ? conv.lastMessage : "Nouvelle connexion — démarrez la conversation"}
                      </p>
                    </div>
                    {conv.hasMessages && (
                      <span className="shrink-0 text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { locale: fr, addSuffix: false })}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Chat panel ── */}
        <div className={cn(
          "flex flex-col h-full overflow-hidden",
          selectedPartner ? "flex" : "hidden md:flex"
        )}>
          {selectedPartner && selectedConv ? (
            <>
              {/* Chat header */}
              <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/8 px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-white/5 md:hidden"
                  onClick={() => setSelectedPartner(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Link
                  to={`/contributeurs/${selectedConv.partnerUsername}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1"
                >
                  <Avatar className="h-8 w-8 border border-white/15 shrink-0">
                    <AvatarImage src={selectedConv.partnerAvatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {selectedConv.partnerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{selectedConv.partnerName}</p>
                      {selectedConv.partnerPublicKey ? (
                        <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20" title="Chiffrement de bout en bout (E2EE) activé">
                          <ShieldCheck className="h-3 w-3 shrink-0" />
                          E2EE
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 border border-amber-500/20" title="Chiffrement standard SSL/TLS en cours">
                          <ShieldAlert className="h-3 w-3 shrink-0" />
                          Standard
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">@{selectedConv.partnerUsername}</p>
                  </div>
                </Link>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                {!canReply && selectedConv && (
                  <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                    <p className="font-semibold">Réponse désactivée</p>
                    <p className="mt-1 text-amber-100/80">
                      Pour répondre, vous devez d’abord être connecté à ce membre.
                      {selectedConv.partnerUsername ? (
                        <>
                          {" "}
                          <button
                            className="underline underline-offset-2"
                            onClick={() => navigate(`/contributeurs/${selectedConv.partnerUsername}`)}
                          >
                            Voir le profil
                          </button>
                        </>
                      ) : null}
                    </p>
                  </div>
                )}
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-muted-foreground">Démarrez la conversation</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user.id;
                      const isLastSent = msg.id === lastSentMsg?.id;
                      return (
                        <div key={msg.id} className={cn("group flex gap-2", isMine ? "justify-end" : "justify-start")}>
                          {!isMine && (
                            <Avatar className="h-6 w-6 shrink-0 mt-1 border border-white/10">
                              <AvatarImage src={selectedConv.partnerAvatar} />
                              <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                                {selectedConv.partnerName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                            <div className={cn(
                              "max-w-[75%] min-w-[8ch] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words leading-snug",
                              isMine
                                ? "rounded-tr-sm bg-primary text-primary-foreground"
                                : "rounded-tl-sm bg-white/8 border border-white/10 text-foreground"
                            )}>
                              {!msg.content.startsWith("[Fichier joint:") && (
                                <p>{msg.content}</p>
                              )}
                              {msg.attachment_url && (
                                <AttachmentRenderer
                                  message={msg}
                                  partnerPublicKey={selectedConv?.partnerPublicKey}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 px-1">
                              <p className="text-[10px] text-muted-foreground/60">
                                {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              {isMine && isLastSent && (
                                msg.read_at ? (
                                  <span className="flex items-center gap-1 text-[10px] text-primary/80 font-medium">
                                    <CheckCheck className="h-3 w-3" />
                                    Vu
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70 font-medium">
                                    <Check className="h-3 w-3" />
                                    Envoyé
                                  </span>
                                )
                              )}
                              {!isMine && (
                                <button
                                  onClick={() => reportMessage(msg.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive"
                                  title="Signaler ce message"
                                >
                                  <Flag className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="flex flex-shrink-0 items-center gap-2 border-t border-white/8 p-3"
              >
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept="image/*,application/pdf"
                />

                {!isRecording && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerFileSelect("image")}
                      disabled={isSending || !canReply}
                      className="h-9 w-9 p-0 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                      title="Envoyer une photo ou un document"
                    >
                      <Paperclip className="h-4.5 w-4.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={startRecording}
                      disabled={isSending || !canReply}
                      className="h-9 w-9 p-0 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                      title="Enregistrer un message vocal"
                    >
                      <Mic className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                )}

                {isRecording ? (
                  <div className="flex flex-1 items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-red-500 animate-pulse" />
                      <span className="font-semibold">
                        Micro actif ({Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => stopRecording(true)}
                        className="h-7 text-[11px] text-muted-foreground hover:text-destructive hover:bg-white/5"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => stopRecording(false)}
                        className="h-7 bg-red-500 text-white hover:bg-red-600 px-3 text-[11px]"
                      >
                        Envoyer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Votre message..."
                    maxLength={MAX_MESSAGE_LENGTH}
                    disabled={!canReply}
                    readOnly={isSending}
                    className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30"
                  />
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim() || isSending || !canReply || isRecording}
                  className="h-9 w-9 shrink-0 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Sélectionnez une conversation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choisissez un contact à gauche pour afficher la conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

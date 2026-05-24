import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowLeft, MessageSquare, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile?: { full_name: string; username: string; avatar_url: string };
  receiver_profile?: { full_name: string; username: string; avatar_url: string };
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerUsername: string;
  partnerAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export function MessagesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchConversations();
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
      markAsRead(selectedPartner);
    }
  }, [selectedPartner]);

  // Supabase Realtime — live messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-inbox-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        async () => {
          await fetchConversations();
          if (selectedPartner) {
            await fetchMessages(selectedPartner);
            markAsRead(selectedPartner);
          }
          useAuthStore.getState().fetchUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedPartner]);

  async function fetchConversations() {
    if (!user) return;

    const { data: sent } = await supabase
      .from("messages")
      .select("*, receiver_profile:profiles!messages_receiver_id_fkey(full_name, username, avatar_url)")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false });

    const { data: received } = await supabase
      .from("messages")
      .select("*, sender_profile:profiles!messages_sender_id_fkey(full_name, username, avatar_url)")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    const allMessages = [...(sent || []), ...(received || [])];
    const convMap = new Map<string, Conversation>();

    for (const msg of allMessages) {
      const isSent = msg.sender_id === user.id;
      const partnerId = isSent ? msg.receiver_id : msg.sender_id;
      const partnerProfile = isSent ? msg.receiver_profile : msg.sender_profile;

      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          partnerId,
          partnerName: partnerProfile?.full_name || "Utilisateur",
          partnerUsername: partnerProfile?.username || "",
          partnerAvatar: partnerProfile?.avatar_url || "",
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unread: 0,
        });
      }

      if (!isSent && !msg.read_at) {
        convMap.get(partnerId)!.unread++;
      }
    }

    setConversations(
      Array.from(convMap.values()).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )
    );
    setIsLoading(false);
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
    setMessages((data || []) as Message[]);
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
    if (!newMessage.trim() || !selectedPartner || !user) return;
    setIsSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedPartner,
      content: newMessage.trim(),
    });
    if (error) {
      toast.error("Erreur lors de l'envoi du message");
    } else {
      setNewMessage("");
      await fetchMessages(selectedPartner);
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
  const lastSentMsg = messages.filter((m) => m.sender_id === user.id).at(-1);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="glass-panel grid h-[560px] overflow-hidden rounded-2xl border border-white/10 md:grid-cols-[300px_1fr]">

        {/* ── Conversations sidebar ── */}
        <div className={cn(
          "flex flex-col border-r border-white/8",
          selectedPartner ? "hidden md:flex" : "flex"
        )}>
          <div className="flex-shrink-0 border-b border-white/8 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Conversations
            </p>
          </div>

          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground">Aucun message</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Envoyez un message depuis un profil.
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
                        {conv.lastMessage}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), { locale: fr, addSuffix: false })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Chat panel ── */}
        <div className={cn(
          "flex flex-col",
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
                <Avatar className="h-8 w-8 border border-white/15">
                  <AvatarImage src={selectedConv.partnerAvatar} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {selectedConv.partnerName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{selectedConv.partnerName}</p>
                  <p className="text-[11px] text-muted-foreground">@{selectedConv.partnerUsername}</p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
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
                              "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                              isMine
                                ? "rounded-tr-sm bg-primary text-primary-foreground"
                                : "rounded-tl-sm bg-white/8 border border-white/10 text-foreground"
                            )}>
                              {msg.content}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 px-1">
                              <p className="text-[10px] text-muted-foreground/60">
                                {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              {isMine && isLastSent && msg.read_at && (
                                <span className="text-[10px] text-primary/70 font-medium">Vu</span>
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
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Votre message..."
                  disabled={isSending}
                  className="bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim() || isSending}
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

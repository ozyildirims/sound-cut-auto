import {
  Bell,
  Bookmark,
  ChevronLeft,
  Compass,
  Disc3,
  Heart,
  Home,
  Inbox,
  ListVideo,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Plus,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  Users
} from 'lucide-react'
import { type ReactNode } from 'react'
import { type SocialPreset } from '@shared/types'

interface Props {
  platform: SocialPreset
  children: ReactNode
}

// Schematic mockups — recognizable silhouette only. No real logos / fonts /
// brand colors. Lucide outline icons stand in for native chrome.
export function PlatformMockup({ platform, children }: Props) {
  return (
    <div className="flex justify-center py-2">
      <div className="relative aspect-[9/16] w-[280px] overflow-hidden rounded-[34px] border border-edge-strong bg-black shadow-float">
        {/* Inset device bezel hint */}
        <div className="pointer-events-none absolute inset-0 rounded-[34px] ring-1 ring-white/5" />

        {/* Video fills the entire frame; chrome is overlaid on top */}
        <div className="absolute inset-0">{children}</div>

        {platform === 'instagram-reel' && <ReelChrome />}
        {platform === 'tiktok' && <TikTokChrome />}
        {platform === 'youtube-shorts' && <ShortsChrome />}
      </div>
    </div>
  )
}

function ReelChrome() {
  return (
    <>
      {/* Top header */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent px-3 pb-4 pt-3 text-white">
        <ChevronLeft className="h-4 w-4" />
        <span className="text-[10px] font-medium tracking-wide">Reels</span>
        <MoreHorizontal className="h-4 w-4" />
      </div>

      {/* Right action stack */}
      <div className="absolute bottom-16 right-2 flex flex-col items-center gap-3 text-white">
        <ActionPill icon={<User className="h-3 w-3" />} />
        <ActionIcon icon={<Heart className="h-4 w-4" />} count="12K" />
        <ActionIcon icon={<MessageCircle className="h-4 w-4" />} count="284" />
        <ActionIcon icon={<Send className="h-4 w-4" />} />
        <ActionIcon icon={<Bookmark className="h-4 w-4" />} />
        <ActionIcon icon={<MoreHorizontal className="h-4 w-4" />} />
        <Disc3 className="h-6 w-6 animate-spin [animation-duration:4s]" />
      </div>

      {/* Bottom caption */}
      <div className="absolute inset-x-0 bottom-8 px-3 text-white">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-white/30" />
          <span className="text-[10px] font-semibold">@kullanici</span>
          <span className="rounded border border-white/50 px-1.5 py-px text-[8px] font-medium">Takip et</span>
        </div>
        <div className="mt-1.5 text-[10px] leading-snug text-white/90 line-clamp-2">
          Otomatik kesilmiş içerik · daha az sessizlik, daha çok izlenme.
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-white/80">
          <Music2 className="h-2.5 w-2.5" /> Orijinal ses
        </div>
      </div>

      {/* Bottom nav */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-white/10 bg-black/50 px-2 py-1.5 text-white/70 backdrop-blur">
        <Home className="h-3.5 w-3.5" />
        <Search className="h-3.5 w-3.5" />
        <Plus className="h-3.5 w-3.5" />
        <Heart className="h-3.5 w-3.5" />
        <User className="h-3.5 w-3.5" />
      </div>
    </>
  )
}

function TikTokChrome() {
  return (
    <>
      {/* Top tabs */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-4 bg-gradient-to-b from-black/40 to-transparent pb-3 pt-3 text-white">
        <span className="text-[10px] text-white/60">Çevreni Keşfet</span>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-semibold">Sana Özel</span>
          <span className="mt-0.5 h-px w-4 bg-white" />
        </div>
      </div>

      {/* Right action stack */}
      <div className="absolute bottom-16 right-2 flex flex-col items-center gap-3 text-white">
        <div className="relative">
          <div className="h-7 w-7 rounded-full border border-white bg-white/20" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-rose-400 p-px">
            <Plus className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </div>
        </div>
        <ActionIcon icon={<Heart className="h-4 w-4 fill-white/0" />} count="248K" />
        <ActionIcon icon={<MessageCircle className="h-4 w-4" />} count="3.1K" />
        <ActionIcon icon={<Bookmark className="h-4 w-4" />} count="892" />
        <ActionIcon icon={<Share2 className="h-4 w-4" />} count="Paylaş" />
        <Disc3 className="h-6 w-6 animate-spin [animation-duration:5s]" />
      </div>

      {/* Bottom caption */}
      <div className="absolute inset-x-0 bottom-8 px-3 text-white">
        <div className="text-[10px] font-semibold">@kullanici</div>
        <div className="mt-1 text-[10px] leading-snug text-white/90 line-clamp-2">
          POV: video editörün otomatik · #SoundCutAuto
        </div>
        <div className="mt-1 flex items-center gap-1 text-[9px] text-white/80">
          <Music2 className="h-2.5 w-2.5" /> orijinal ses — @kullanici
        </div>
      </div>

      {/* Bottom nav */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-white/10 bg-black/50 px-2 py-1.5 text-white/70 backdrop-blur">
        <div className="flex flex-col items-center">
          <Home className="h-3.5 w-3.5 text-white" />
          <span className="text-[7px]">Ana</span>
        </div>
        <div className="flex flex-col items-center">
          <Users className="h-3.5 w-3.5" />
          <span className="text-[7px]">Arkad.</span>
        </div>
        <div className="rounded-md bg-white px-2 py-0.5">
          <Plus className="h-3 w-3 text-black" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-center">
          <Inbox className="h-3.5 w-3.5" />
          <span className="text-[7px]">Gelen</span>
        </div>
        <div className="flex flex-col items-center">
          <User className="h-3.5 w-3.5" />
          <span className="text-[7px]">Profil</span>
        </div>
      </div>
    </>
  )
}

function ShortsChrome() {
  return (
    <>
      {/* Top */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/30 to-transparent px-3 pb-3 pt-3 text-white">
        <span className="text-[10px] font-semibold tracking-tight">Shorts</span>
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          <MoreHorizontal className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Right action stack */}
      <div className="absolute bottom-20 right-2 flex flex-col items-center gap-3 text-white">
        <ActionIcon icon={<ThumbsUp className="h-4 w-4" />} count="98K" />
        <ActionIcon icon={<ThumbsDown className="h-4 w-4" />} />
        <ActionIcon icon={<MessageCircle className="h-4 w-4" />} count="1.2K" />
        <ActionIcon icon={<Share2 className="h-4 w-4" />} count="Paylaş" />
        <ActionIcon icon={<ShoppingBag className="h-4 w-4" />} />
        <ActionIcon icon={<MoreHorizontal className="h-4 w-4" />} />
        <div className="mt-1 h-7 w-7 rounded-md bg-white/15 ring-1 ring-white/20" />
      </div>

      {/* Bottom caption */}
      <div className="absolute inset-x-0 bottom-10 px-3 text-white">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-white/30" />
          <span className="text-[10px] font-semibold">@kullanici</span>
          <span className="rounded-full bg-white px-1.5 py-px text-[8px] font-semibold text-black">Abone ol</span>
        </div>
        <div className="mt-1.5 text-[10px] leading-snug text-white/90 line-clamp-2">
          Sessizlikleri kestim → 60sn'e indirdim. #shorts
        </div>
      </div>

      {/* Bottom nav */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-white/10 bg-black/60 px-2 py-1.5 text-white/70 backdrop-blur">
        <NavItem icon={<Home className="h-3.5 w-3.5" />} label="Ana" />
        <NavItem icon={<Sparkles className="h-3.5 w-3.5 text-white" />} label="Shorts" active />
        <Plus className="h-4 w-4" />
        <NavItem icon={<ListVideo className="h-3.5 w-3.5" />} label="Abone" />
        <NavItem icon={<Bell className="h-3.5 w-3.5" />} label="Sen" />
      </div>
    </>
  )
}

function ActionIcon({ icon, count }: { icon: ReactNode; count?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {icon}
      {count && <span className="text-[8px] font-medium">{count}</span>}
    </div>
  )
}

function ActionPill({ icon }: { icon: ReactNode }) {
  return <div className="rounded-full border border-white bg-white/10 p-1 backdrop-blur">{icon}</div>
}

function NavItem({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center ${active ? 'text-white' : 'text-white/60'}`}>
      {icon}
      <span className="text-[7px]">{label}</span>
    </div>
  )
}

// Compass used for icon — keep it referenced so a future style sweep doesn't
// strip the import accidentally
void Compass

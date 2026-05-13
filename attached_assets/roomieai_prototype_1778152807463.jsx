import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type IconProps = {
  className?: string;
};

function iconClass(className?: string) {
  return className ?? "h-5 w-5";
}

function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  );
}

function MessageCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M20 11.5c0 4.7-4 8.5-9 8.5-1.2 0-2.4-.2-3.4-.7L4 20l.9-3C4.3 15.7 4 13.7 4 11.5 4 6.8 8 3 13 3s7 3.8 7 8.5Z" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5" />
    </svg>
  );
}

function SlidersHorizontalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M4 7h16" />
      <path d="M4 17h16" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="17" r="2" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M12 3 5.5 5.5v5.8c0 4.1 2.6 7.8 6.5 9.2 3.9-1.4 6.5-5.1 6.5-9.2V5.5L12 3Z" />
      <path d="m9.5 11.8 1.7 1.7 3.6-4" />
    </svg>
  );
}

function SchoolIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z" />
      <path d="M7 11.5V16c0 1.7 2.4 3 5 3s5-1.3 5-3v-4.5" />
    </svg>
  );
}

function MapPinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M7 3v3M17 3v3" />
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9.5h16" />
    </svg>
  );
}

function DollarSignIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M12 3v18" />
      <path d="M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
    </svg>
  );
}

function MoonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5Z" />
    </svg>
  );
}

function SparklesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
      <path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
    </svg>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <circle cx="9" cy="9" r="2.5" />
      <circle cx="16.5" cy="8.5" r="2" />
      <path d="M4.5 18c1-2.5 2.9-3.8 5.4-3.8S14.3 15.5 15.3 18" />
      <path d="M14.5 17.5c.7-1.7 2-2.7 3.8-2.7 1.1 0 2.1.4 3.2 1.3" />
    </svg>
  );
}

function BedDoubleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M3 19v-7h18v7" />
      <path d="M3 15h18" />
      <path d="M6 12V8h5v4" />
      <path d="M13 12V9h5v3" />
    </svg>
  );
}

function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M6.5 16.5h11L16 14.8V10a4 4 0 1 0-8 0v4.8l-1.5 1.7Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass(className)}>
      <path d="M12 20.5s-7-4.3-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10.5c0 5.7-7 10-7 10Z" />
    </svg>
  );
}

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function CheckCircle2Icon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.3 2.3 4.7-4.8" />
    </svg>
  );
}

const tabs = [
  { id: "match", label: "Match", icon: HomeIcon },
  { id: "messages", label: "Messages", icon: MessageCircleIcon },
  { id: "housing", label: "Housing", icon: BedDoubleIcon },
  { id: "profile", label: "Profile", icon: UserIcon },
];

const profile = {
  name: "Layla",
  age: 22,
  match: 87,
  university: "Northeastern University",
  emailDomain: "neu.edu",
  title: "4th year student · Boston",
  bio: "Looking for a same-gender roommate who values cleanliness, respectful communication, and a calm home during the week. I like a friendly space, but not one that feels chaotic.",
  budget: "$1,150–$1,450",
  moveIn: "Aug 2026",
  neighborhoods: ["Mission Hill", "Fenway", "Back Bay"],
  lifestyle: ["Clean", "Quiet", "Non-smoking", "Early sleeper"],
  communication: ["Direct communicator", "Prefers planned guests"],
  culture: ["Arabic", "Muslim", "Values privacy"],
  trust: ["Verified student", "Same-gender only", "Serious renter"],
  prompts: [
    {
      q: "Ideal roommate vibe",
      a: "Someone respectful, easy to communicate with, and serious about finding a good long-term fit.",
    },
    {
      q: "At home I’m usually",
      a: "Studying, meal prepping, or winding down quietly after class and work.",
    },
    {
      q: "One thing I care about a lot",
      a: "Clear expectations around cleanliness, sleep schedule, and shared space boundaries.",
    },
  ],
};

const messages = {
  direct: [
    {
      name: "Mariam",
      preview: "I’m also aiming for August. Mission Hill works for me.",
      time: "2m",
      unread: 2,
      score: 91,
    },
    {
      name: "Huda",
      preview: "Thanks for sharing your schedule. I’m pretty quiet too.",
      time: "1h",
      unread: 0,
      score: 84,
    },
    {
      name: "Zahra",
      preview: "Would you want to compare apartment options this weekend?",
      time: "3h",
      unread: 0,
      score: 79,
    },
  ],
  groups: [
    {
      name: "Mission Hill Fall Room",
      preview: "Open room tour photos were added.",
      members: 4,
      time: "15m",
      unread: 4,
    },
    {
      name: "NEU Co-op Housing Group",
      preview: "Two people are free to chat tonight at 8:00.",
      members: 5,
      time: "5h",
      unread: 0,
    },
  ],
};

const housingData = {
  rooms: [
    {
      name: "Mission Hill Fall 2026",
      rent: "$1,250",
      area: "Mission Hill",
      moveIn: "Aug 28",
      roommates: ["A", "M", "S"],
      tags: ["Same-gender", "Verified", "Quiet home", "Near NEU"],
      desc: "3 current Northeastern students looking for 1 more roommate. Clean, respectful, and mostly quiet on weekdays.",
    },
    {
      name: "Fenway Open Room",
      rent: "$1,390",
      area: "Fenway",
      moveIn: "Sep 1",
      roommates: ["N", "H"],
      tags: ["Same-gender", "Serious renters", "No smoking"],
      desc: "2 students with a furnished living room and clear shared-space rules. Looking for someone organized and communicative.",
    },
  ],
  groups: [
    {
      name: "NEU Girls Housing Group",
      rent: "$1,100–$1,350",
      area: "Boston",
      moveIn: "Late Aug",
      roommates: ["L", "R", "D"],
      tags: ["Forming group", "Same-gender", "Student verified"],
      desc: "Three Northeastern students still searching for a 4-bedroom apartment together and want one more person to join the search.",
    },
    {
      name: "Co-op Semester Group",
      rent: "$1,200–$1,500",
      area: "Back Bay / Fenway",
      moveIn: "Jan 2027",
      roommates: ["Y", "K"],
      tags: ["Early planning", "Same-gender", "Flexible area"],
      desc: "Planning ahead for a co-op semester with a strong preference for a calm home and planned guest expectations.",
    },
  ],
};

function MatchBadge({ score }: { score: number }) {
  const tone =
    score >= 85
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score >= 70
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-slate-100 text-slate-600 border-slate-200";
  return <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{score}% Match</Badge>;
}

function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<IconProps>; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="rounded-full bg-sky-100 p-2 text-sky-700">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

function AppHeader({ right }: { title?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-sky-100 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-start gap-1">
        <div className="text-xl font-semibold tracking-tight text-slate-900">Roomie</div>
        <div className="rounded-sm border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">AI</div>
      </div>
      {right}
    </div>
  );
}

function MatchScreen() {
  return (
    <div className="pb-28">
      <AppHeader
        right={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <BellIcon className="h-5 w-5 text-slate-600" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <SlidersHorizontalIcon className="h-5 w-5 text-slate-600" />
            </Button>
          </div>
        }
      />

      <div className="px-4 pt-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden rounded-[28px] border-sky-100 bg-white shadow-[0_18px_60px_-24px_rgba(14,165,233,0.45)]">
            <div className="relative h-72 bg-gradient-to-br from-sky-200 via-sky-100 to-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(186,230,253,0.7),transparent_30%)]" />
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <MatchBadge score={profile.match} />
                <Badge className="rounded-full border border-white/70 bg-white/80 text-slate-700 backdrop-blur">Same-gender only</Badge>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-[22px] bg-white/85 p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-2xl font-semibold text-slate-900">
                      {profile.name}, {profile.age}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{profile.title}</div>
                  </div>
                  <div className="rounded-2xl bg-sky-50 px-3 py-2 text-right">
                    <div className="text-[11px] uppercase tracking-wide text-sky-700">Verified</div>
                    <div className="text-xs font-medium text-slate-700">{profile.emailDomain}</div>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="space-y-5 p-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-sky-50 p-3">
                  <div className="flex items-center gap-2 text-sky-700">
                    <DollarSignIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Budget</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">{profile.budget}</div>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3">
                  <div className="flex items-center gap-2 text-sky-700">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Move-in</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">{profile.moveIn}</div>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3">
                  <div className="flex items-center gap-2 text-sky-700">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Areas</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">Boston</div>
                </div>
              </div>

              <div>
                <SectionTitle icon={SparklesIcon} title="About" />
                <p className="text-sm leading-6 text-slate-700">{profile.bio}</p>
              </div>

              <div>
                <SectionTitle icon={SchoolIcon} title="University" />
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div>
                    <div className="font-medium text-slate-900">{profile.university}</div>
                    <div className="text-xs text-slate-500">Verified school domain: @{profile.emailDomain}</div>
                  </div>
                  <ShieldCheckIcon className="h-5 w-5 text-sky-700" />
                </div>
              </div>

              <div>
                <SectionTitle icon={MoonIcon} title="Lifestyle" />
                <div className="flex flex-wrap gap-2">
                  {profile.lifestyle.map((item) => (
                    <Badge key={item} className="rounded-full bg-sky-50 px-3 py-1 text-slate-700 hover:bg-sky-50">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle icon={MessageCircleIcon} title="Communication & home habits" />
                <div className="flex flex-wrap gap-2">
                  {profile.communication.map((item) => (
                    <Badge key={item} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-100">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle icon={UsersIcon} title="What matters to me" />
                <div className="space-y-3">
                  {profile.prompts.map((prompt) => (
                    <div key={prompt.q} className="rounded-2xl border border-slate-100 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">{prompt.q}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-700">{prompt.a}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle icon={HeartIcon} title="Culture & preferences" />
                <div className="flex flex-wrap gap-2">
                  {profile.culture.map((item) => (
                    <Badge key={item} className="rounded-full bg-sky-50 px-3 py-1 text-slate-700 hover:bg-sky-50">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle icon={ShieldCheckIcon} title="Trust signals" />
                <div className="flex flex-wrap gap-2">
                  {profile.trust.map((item) => (
                    <Badge key={item} className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="fixed bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4 rounded-full border border-sky-100 bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
        <Button size="icon" className="h-14 w-14 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
          <XIcon className="h-6 w-6" />
        </Button>
        <Button size="icon" className="h-16 w-16 rounded-full bg-sky-600 text-white hover:bg-sky-600">
          <HeartIcon className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}

function MessagesScreen() {
  const [subtab, setSubtab] = useState<"direct" | "groups">("direct");
  const list = subtab === "direct" ? messages.direct : messages.groups;

  return (
    <div className="pb-24">
      <AppHeader
        right={
          <Button variant="ghost" size="icon" className="rounded-full">
            <SearchIcon className="h-5 w-5 text-slate-600" />
          </Button>
        }
      />
      <div className="px-4 pt-4">
        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-sky-50 p-1">
          {[
            { id: "direct", label: "Direct Messages" },
            { id: "groups", label: "Group Chats" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSubtab(item.id as "direct" | "groups")}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${subtab === item.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {subtab === "direct" && (
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              "Ask about cleanliness",
              "Ask about guest rules",
              "Ask about move-in timing",
              "Ask about quiet hours",
            ].map((chip) => (
              <Badge key={chip} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-100">
                {chip}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {list.map((item) => (
            <Card key={item.name} className="rounded-2xl border-sky-100 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-12 w-12 border border-sky-100 bg-sky-100">
                  <AvatarFallback className="bg-sky-100 font-semibold text-sky-700">
                    {item.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold text-slate-900">{item.name}</div>
                      {"score" in item && item.score ? <MatchBadge score={item.score} /> : null}
                      {"members" in item && item.members ? (
                        <Badge className="rounded-full bg-sky-50 text-sky-700 hover:bg-sky-50">{item.members} members</Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500">{item.time}</div>
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-600">{item.preview}</div>
                </div>
                {item.unread ? (
                  <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-600 px-2 text-xs font-semibold text-white">
                    {item.unread}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function HousingCard({ item }: { item: (typeof housingData.rooms)[number] | (typeof housingData.groups)[number] }) {
  return (
    <Card className="overflow-hidden rounded-[24px] border-sky-100 shadow-sm">
      <div className="h-28 bg-gradient-to-r from-sky-200 via-sky-100 to-white" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-900">{item.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <DollarSignIcon className="h-4 w-4" />
                {item.rent}
              </span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                {item.area}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {item.moveIn}
              </span>
            </div>
          </div>
          <Button className="rounded-full bg-sky-600 px-4 text-white hover:bg-sky-600">Request</Button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex -space-x-2">
            {item.roommates.map((r, i) => (
              <Avatar key={`${r}-${i}`} className="h-8 w-8 border-2 border-white bg-sky-100">
                <AvatarFallback className="bg-sky-100 text-xs font-semibold text-sky-700">{r}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="text-xs text-slate-500">Current members</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <Badge key={tag} className="rounded-full bg-sky-50 px-3 py-1 text-slate-700 hover:bg-sky-50">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{item.desc}</p>
      </CardContent>
    </Card>
  );
}

function HousingScreen() {
  const [subtab, setSubtab] = useState<"rooms" | "groups">("rooms");
  const list = subtab === "rooms" ? housingData.rooms : housingData.groups;

  return (
    <div className="pb-24">
      <AppHeader
        right={
          <Button variant="ghost" size="icon" className="rounded-full">
            <PlusIcon className="h-5 w-5 text-slate-600" />
          </Button>
        }
      />
      <div className="px-4 pt-4">
        <div className="mb-4 rounded-[24px] border border-sky-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Find a room or join a group</div>
              <div className="text-sm text-slate-600">
                Built for users who already have housing and users still forming a same-gender roommate group.
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-sky-50 p-1">
          {[
            { id: "rooms", label: "Open Rooms" },
            { id: "groups", label: "Forming Groups" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSubtab(item.id as "rooms" | "groups")}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${subtab === item.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {list.map((item) => (
            <HousingCard key={item.name} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="pb-24">
      <AppHeader right={<Button className="rounded-full bg-sky-600 text-white hover:bg-sky-600">Edit Profile</Button>} />
      <div className="px-4 pt-4">
        <Card className="overflow-hidden rounded-[28px] border-sky-100 shadow-[0_18px_60px_-24px_rgba(14,165,233,0.45)]">
          <div className="h-28 bg-gradient-to-r from-sky-300 via-sky-100 to-white" />
          <CardContent className="relative p-4">
            <div className="-mt-14 flex items-end justify-between gap-3">
              <div className="flex items-end gap-3">
                <Avatar className="h-24 w-24 border-4 border-white bg-sky-100">
                  <AvatarFallback className="bg-sky-100 text-2xl font-semibold text-sky-700">LH</AvatarFallback>
                </Avatar>
                <div className="pb-2">
                  <div className="text-2xl font-semibold text-slate-900">Layla H.</div>
                  <div className="mt-1 text-sm text-slate-600">Student · Boston</div>
                </div>
              </div>
              <MatchBadge score={87} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-sky-50 p-3">
                <div className="text-xs font-medium text-sky-700">University</div>
                <div className="mt-1 font-semibold text-slate-900">Northeastern</div>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3">
                <div className="text-xs font-medium text-sky-700">Verified school email</div>
                <div className="mt-1 font-semibold text-slate-900">@neu.edu</div>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <SectionTitle icon={CheckCircle2Icon} title="Profile summary" />
                <p className="text-sm leading-6 text-slate-700">
                  Clean, calm, and serious about finding a good roommate fit. Looking for a same-gender roommate for Fall 2026 with similar communication and shared-space expectations.
                </p>
              </div>

              <div>
                <SectionTitle icon={SparklesIcon} title="My preferences" />
                <div className="flex flex-wrap gap-2">
                  {[
                    "Same-gender only",
                    "$1,150–$1,450",
                    "Aug 2026",
                    "Mission Hill / Fenway",
                    "Quiet home",
                    "Planned guests",
                    "Clean shared space",
                  ].map((item) => (
                    <Badge key={item} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-100">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle icon={ShieldCheckIcon} title="Trust & verification" />
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Verified university domain",
                    "Same-gender matching enabled",
                    "Clear roommate preferences completed",
                    "Serious renter badge",
                  ].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3">
                      <span className="text-sm text-slate-700">{item}</span>
                      <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PrototypeNotes() {
  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] border-sky-100 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Prototype choices built from your project</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-slate-600">
          <div className="rounded-2xl bg-sky-50 p-4">
            <span className="font-semibold text-slate-900">Match tab:</span> Hinge-style scrollable roommate profile with a photo-first layout, visible compatibility score, trust badges, and deeper lifestyle details further down.
          </div>
          <div className="rounded-2xl bg-sky-50 p-4">
            <span className="font-semibold text-slate-900">Messages tab:</span> split into direct messages and group chats, with optional roommate-specific prompt chips above conversations.
          </div>
          <div className="rounded-2xl bg-sky-50 p-4">
            <span className="font-semibold text-slate-900">Housing tab:</span> divided into Open Rooms and Forming Groups so the app supports both existing housing and new group formation.
          </div>
          <div className="rounded-2xl bg-sky-50 p-4">
            <span className="font-semibold text-slate-900">Profile tab:</span> polished public-facing view with Northeastern verification, same-gender matching, and trust-focused settings visible.
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-sky-100 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Next refinements you could make</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {[
            "Add a dedicated Filters screen for budget, location, move-in timeline, cleanliness, guests, smoking, language, and optional religion.",
            "Create a detailed group page with apartment photos, roommate cards, house rules, and a join request flow.",
            "Add a small match explanation module like ‘Why you match’ to reinforce transparency and trust.",
            "Turn the current prototype screens into a presentation demo by walking through Match → Like → Messages → Open Rooms → Profile.",
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-slate-100 p-4">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
              <div>{item}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-sky-100 bg-gradient-to-br from-sky-600 to-sky-500 text-white shadow-sm">
        <CardContent className="p-6">
          <div className="text-lg font-semibold">Why this direction fits your paper</div>
          <p className="mt-2 text-sm leading-6 text-sky-50">
            The prototype highlights the exact themes from your project: fragmentation, trust, clear profile information, same-gender matching, compatibility beyond rent and location, and a more human-centered roommate search flow.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-sky-100 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Prototype smoke checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div className="rounded-2xl bg-slate-50 p-4">Tabs rendered: {tabs.length}</div>
          <div className="rounded-2xl bg-slate-50 p-4">Direct messages: {messages.direct.length}</div>
          <div className="rounded-2xl bg-slate-50 p-4">Group chats: {messages.groups.length}</div>
          <div className="rounded-2xl bg-slate-50 p-4">Open rooms: {housingData.rooms.length}</div>
          <div className="rounded-2xl bg-slate-50 p-4">Forming groups: {housingData.groups.length}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RoomieAIPrototype() {
  const [tab, setTab] = useState("match");

  const screen = useMemo(() => {
    if (tab === "messages") return <MessagesScreen />;
    if (tab === "housing") return <HousingScreen />;
    if (tab === "profile") return <ProfileScreen />;
    return <MatchScreen />;
  }, [tab]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e0f2fe_0%,#f8fbff_25%,#f8fbff_100%)] p-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[420px_1fr]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mx-auto overflow-hidden rounded-[38px] border border-sky-100 bg-white shadow-[0_30px_100px_-30px_rgba(14,165,233,0.45)]">
            <div className="h-8 bg-sky-50" />
            <div className="relative h-[780px] overflow-y-auto bg-white">{screen}</div>
            <div className="sticky bottom-0 z-30 border-t border-sky-100 bg-white/95 px-3 py-3 backdrop-blur">
              <div className="grid grid-cols-4 gap-2">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium transition ${tab === id ? "bg-sky-50 text-sky-700" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <PrototypeNotes />
      </div>
    </div>
  );
}

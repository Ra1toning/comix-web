import { Check, Flame, Gem, Info, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PricingPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pt-16">
      <div className="text-center mb-24 relative z-10">
         <Badge variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/20 mb-6 px-4 py-1.5 text-xs font-semibold tracking-widest rounded-full mix-blend-screen shadow-[0_0_20px_rgba(236,72,153,0.1)] inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> PREMIUM PLANS
         </Badge>
         <h1 className="text-5xl md:text-7xl font-medium tracking-tighter text-white mb-6 leading-tight">
           Төлбөртэй эрх
         </h1>
         <p className="text-xl text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
           Хязгааргүй унших эрхээ идэвхжүүлж, манай орчуулагчдын багийг дэмжээрэй. Сурталчилгаагүй цэвэр орчин.
         </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32 relative z-10">


        <Card className="bg-[#020202]/80 backdrop-blur-3xl border-white/5 rounded-4xl p-4 flex flex-col relative overflow-hidden group">
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl font-semibold text-white mb-2">Free</CardTitle>
            <CardDescription className="text-zinc-500">Эхлэн хэрэглэгчдэд зориулсан</CardDescription>
            <div className="mt-8 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tighter text-white">0₮</span>
              <span className="text-zinc-500 font-medium">/сар</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <ul className="space-y-4 text-zinc-400">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white/50 shrink-0" />
                <span>Зарим цувралын эхний бүлгүүд</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white/50 shrink-0" />
                <span>Сурталчилгаатай</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 opacity-50">
                <div className="w-5 h-5 rounded border border-white/10 shrink-0 flex items-center justify-center font-bold text-xs" />
                <span>Шинэ бүлэг шууд үзэх</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 opacity-50">
                <div className="w-5 h-5 rounded border border-white/10 shrink-0 flex items-center justify-center font-bold text-xs" />
                <span>VIP Badge & Profile</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-14 font-medium tracking-wide">
              Одоо ашиглаж буй
            </Button>
          </CardFooter>
        </Card>


        <Card className="bg-zinc-900 border-white/[0.08] rounded-4xl p-4 flex flex-col relative overflow-hidden ring-1 ring-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] transform md:-translate-y-4">
          <div className="absolute inset-0 bg-linear-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-4 right-4 bg-white text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Popular
          </div>

          <CardHeader className="pb-8 relative z-10">
            <CardTitle className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
              <Flame className="w-5 h-5 text-pink-400" /> Premium
            </CardTitle>
            <CardDescription className="text-pink-200/60">Идэвхтэй уншигчдад</CardDescription>
            <div className="mt-8 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tighter text-white">9,900₮</span>
              <span className="text-zinc-500 font-medium">/сар</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6 relative z-10">
            <ul className="space-y-4 text-zinc-200 font-medium">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-pink-400 shrink-0" />
                <span>Бүх цуврал, бүх бүлэг нээлттэй</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-pink-400 shrink-0" />
                <span>0% Сурталчилгаа</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-pink-400 shrink-0" />
                <span>Шинэ бүлгийг гармагц унших</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-pink-400 shrink-0" />
                <span>Premium хадгалах сан (Library)</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="relative z-10">
            <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl h-14 font-semibold text-lg tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
              Сонгох
            </Button>
          </CardFooter>
        </Card>


        <Card className="bg-[#020202]/80 backdrop-blur-3xl border-white/5 rounded-4xl p-4 flex flex-col relative overflow-hidden group">
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
              <Gem className="w-5 h-5 text-purple-400" /> VIP Annual
            </CardTitle>
            <CardDescription className="text-zinc-500">Жилээр төлж хамгийн ихийг хэмнэх</CardDescription>
            <div className="mt-8 flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tighter text-white">89,000₮</span>
                <span className="text-zinc-500 font-medium">/жил</span>
              </div>
              <span className="text-sm text-green-400 font-medium mt-2 bg-green-400/10 w-fit px-2 py-0.5 rounded border border-green-400/20">25% хэмнэнэ</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <ul className="space-y-4 text-zinc-300">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 shrink-0" />
                <span>Premium эрхийг бүтэн жил ашиглах</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 shrink-0" />
                <span>Discord VIP Role</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 shrink-0" />
                <span>Онцгой VIP badge</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-400 shrink-0" />
                <span>Шинэ төсөлд санал өгөх эрх</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-14 font-medium tracking-wide">
              Сонгох
            </Button>
          </CardFooter>
        </Card>

      </div>


      <div className="max-w-3xl mx-auto text-center space-y-6 mb-20">
        <h3 className="text-2xl font-medium tracking-tight text-white mb-8">Байнга асуудаг асуултууд</h3>

        {[
          { q: "Сарын эрх автоматаар сунгагдах уу?", a: "Үгүй. Таны сонгосон багцын хугацаа дуусахад эрх цуцлагдах бөгөөд та хүсвэл өөрөө дахин сунгах боломжтой." },
          { q: "Төлбөр төлж чадахгүй бол яах вэ?", a: "Free эрхээрээ үнэгүй цувралуудыг хэвийн үргэлжлүүлэн унших боломжтой. Харин Premium тэмдэгтэй цувралд хандах боломжгүй." },
          { q: "Буруу багц авсан бол буцаалт хийх үү?", a: "Хэрэв та худалдан авалт хийснээс хойш 24 цагийн дотор ямар нэгэн цувралын төлбөртэй бүлэг уншаагүй бол буцаалт хийх боломжтой." }
        ].map((faq, i) => (
           <div key={i} className="bg-white/2 border border-white/4 p-6 rounded-2xl text-left hover:bg-white/3 transition-colors">
             <h4 className="text-lg font-medium text-white mb-2 flex items-center gap-3">
                <Info className="w-5 h-5 text-zinc-500" /> {faq.q}
             </h4>
             <p className="text-zinc-400 font-light pl-8">{faq.a}</p>
           </div>
        ))}
      </div>
    </div>
  )
}

import { motion } from "framer-motion";

export function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60 dark:text-white/60">{label}</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${accent}`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}

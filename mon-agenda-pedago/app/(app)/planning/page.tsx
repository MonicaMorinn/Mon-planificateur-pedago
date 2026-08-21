@@
-import { useEffect, useState } from 'react'
-import { useRouter, useSearchParams } from 'next/navigation'
-import { useAuthStore } from '@/lib/store'
+import { useEffect, useState } from 'react'
+import { useRouter, useSearchParams } from 'next/navigation'
+import { useAuthStore, useSettingsStore } from '@/lib/store'
@@
-import { formatDate, isSameDay } from '@/lib/utils'
+import { formatDate, isSameDay } from '@/lib/utils'
+import SectionOrderEditor from '@/components/SectionOrderEditor'
@@
 export default function DailyPlannerPage() {
@@
-  const [currentDate, setCurrentDate] = useState<Date>(
+  const settingsStore = useSettingsStore()
+  const { sectionsOrder, setSectionsOrder, loadFromLocal } = settingsStore
+
+  const [currentDate, setCurrentDate] = useState<Date>(
     searchParams.get('date')
       ? new Date(searchParams.get('date')!)
       : new Date()
   )
@@
-  useEffect(() => {
-    if (!user || !token) {
-      router.push('/auth')
-      return
-    }
-    loadData()
-  }, [user, token, router])
+  // modal for layout customization
+  const [layoutOpen, setLayoutOpen] = useState(false)
+
+  useEffect(() => {
+    if (!user || !token) {
+      router.push('/auth')
+      return
+    }
+    loadFromLocal()
+    loadData()
+    // load server settings
+    fetchSettings()
+  }, [user, token, router])
+
+  async function fetchSettings() {
+    try {
+      const res = await fetch('/api/settings')
+      if (!res.ok) return
+      const json = await res.json()
+      const s = json.settings
+      if (s && s.quickLinks) {
+        try {
+          const q = typeof s.quickLinks === 'string' ? JSON.parse(s.quickLinks) : s.quickLinks
+          if (q && q.layoutSections && Array.isArray(q.layoutSections)) {
+            setSectionsOrder(q.layoutSections)
+            try { localStorage.setItem('agenda.sectionsOrder', JSON.stringify(q.layoutSections)) } catch {}
+          }
+        } catch (e) {
+          // ignore parse error
+        }
+      }
+    } catch (e) {
+      console.error('Failed to fetch settings', e)
+    }
+  }
+
+  const saveSettingsServer = async (order: Array<'notes'|'calendar'|'surveillances'>) => {
+    try {
+      await fetch('/api/settings', {
+        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ layoutSections: order })
+      })
+    } catch (e) { console.error('Failed to save settings', e) }
+  }
@@
-  const loadData = async () => {
+  const loadData = async () => {
@@
   }
+
+  useEffect(() => {
+    // whenever sectionsOrder changes, persist to server
+    if (!sectionsOrder) return
+    saveSettingsServer(sectionsOrder)
+  }, [sectionsOrder])
@@
-  const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1
-  const dayName = DAYS[dayOfWeek]
+  const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1
+  const dayName = DAYS[dayOfWeek]
@@
-            <div className="flex gap-2">
+            <div className="flex gap-2">
@@
-            </div>
+            </div>
+            <button
+              onClick={() => setLayoutOpen(true)}
+              className="px-3 py-2 ml-2 bg-slate-100 rounded hover:bg-slate-200 text-sm"
+            >
+              Personnaliser la mise en page
+            </button>
@@
-        </div>
+        </div>
@@
-        </div>
+        </div>
+
+        {/* Modal for layout customization */}
+        {layoutOpen && (
+          <div className="fixed inset-0 flex items-center justify-center z-50">
+            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setLayoutOpen(false)} />
+            <div className="relative bg-white rounded-lg p-6 z-10 w-full max-w-md shadow-lg">
+              <h3 className="text-lg font-semibold mb-4">Personnaliser la mise en page (page 2)</h3>
+              <p className="text-sm text-gray-600 mb-3">Glisse les sections pour changer leur ordre (ou utilise les flèches pour l'accessibilité).</p>
+              <SectionOrderEditor value={sectionsOrder as any} onChange={(v) => setSectionsOrder(v)} />
+              <div className="flex justify-end gap-2 mt-4">
+                <button onClick={() => setLayoutOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Fermer</button>
+              </div>
+            </div>
+          </div>
+        )}
 
       </div>
     </Layout>
   )
 }

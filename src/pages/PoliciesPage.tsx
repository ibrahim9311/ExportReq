import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const PoliciesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">الشروط والأحكام</h1>
            <p className="text-gray-600">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>

          <div className="space-y-6 text-right">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">1. مقدمة</h2>
              <p className="text-gray-700 leading-relaxed">
                مرحباً بك في نظام إدارة اشتراطات التصدير. باستخدامك لهذا الموقع، فإنك توافق على الالتزام بهذه الشروط والأحكام.
                يرجى قراءة هذه الشروط بعناية قبل استخدام خدماتنا.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">2. استخدام الخدمة</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                عند التسجيل في خدماتنا، فإنك توافق على:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 pr-4">
                <li>تقديم معلومات دقيقة وصحيحة عن نفسك</li>
                <li>الحفاظ على أمان حسابك وكلمة المرور الخاصة بك</li>
                <li>عدم استخدام الخدمة لأي أغراض غير قانونية</li>
                <li>احترام حقوق المستخدمين الآخرين والملكية الفكرية</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">3. الخصوصية وحماية البيانات</h2>
              <p className="text-gray-700 leading-relaxed">
                نحن نلتزم بحماية خصوصيتك. يتم جمع بياناتك الشخصية واستخدامها وفقاً لسياسة الخصوصية الخاصة بنا.
                نحن لا نشارك معلوماتك مع أطراف ثالثة دون موافقتك الصريحة، إلا عندما يكون ذلك مطلوباً بموجب القانون.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">4. حقوق الملكية الفكرية</h2>
              <p className="text-gray-700 leading-relaxed">
                جميع المحتويات والمواد المتاحة على هذا الموقع، بما في ذلك النصوص والرسومات والشعارات والأيقونات والصور،
                هي ملكية حصرية لنا أو لمرخصينا وتخضع لقوانين حقوق النشر والملكية الفكرية.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">5. إنهاء الحساب</h2>
              <p className="text-gray-700 leading-relaxed">
                نحتفظ بالحق في تعليق أو إنهاء حسابك في أي وقت إذا انتهكت هذه الشروط والأحكام أو إذا قمت بأي نشاط
                قد يضر بالموقع أو بمستخدميه الآخرين.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">6. تحديد المسؤولية</h2>
              <p className="text-gray-700 leading-relaxed">
                نحن نبذل قصارى جهدنا لضمان دقة وموثوقية المعلومات المقدمة على هذا الموقع. ومع ذلك، لا نتحمل أي مسؤولية
                عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدامك للموقع أو عدم القدرة على استخدامه.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">7. التعديلات على الشروط</h2>
              <p className="text-gray-700 leading-relaxed">
                نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد
                الإلكتروني أو من خلال إشعار على الموقع. استمرارك في استخدام الخدمة بعد التعديلات يعني موافقتك على الشروط الجديدة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">8. القانون الواجب التطبيق</h2>
              <p className="text-gray-700 leading-relaxed">
                تخضع هذه الشروط والأحكام لقوانين المملكة العربية السعودية. أي نزاع ينشأ عن أو يتعلق بهذه الشروط
                سيتم حله وفقاً للقوانين والأنظمة المعمول بها.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">9. الاتصال بنا</h2>
              <p className="text-gray-700 leading-relaxed">
                إذا كان لديك أي أسئلة أو استفسارات حول هذه الشروط والأحكام، يرجى التواصل معنا عبر البريد الإلكتروني
                أو من خلال صفحة الاتصال الخاصة بنا.
              </p>
            </section>
          </div>

          <div className="mt-8 flex justify-center">
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة للتسجيل
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PoliciesPage;

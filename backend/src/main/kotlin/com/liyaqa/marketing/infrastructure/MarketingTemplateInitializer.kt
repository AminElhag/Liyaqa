package com.liyaqa.marketing.infrastructure

import com.liyaqa.marketing.domain.model.Campaign
import com.liyaqa.marketing.domain.model.CampaignStep
import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.model.MarketingChannel
import com.liyaqa.marketing.domain.model.TriggerConfig
import com.liyaqa.marketing.domain.model.TriggerType
import com.liyaqa.marketing.domain.ports.CampaignRepository
import com.liyaqa.marketing.domain.ports.CampaignStepRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Initializes pre-built campaign templates on application startup.
 * Templates provide starting points for common marketing automation scenarios.
 */
@Component
@Order(100) // Run after other initializers
class MarketingTemplateInitializer(
    private val campaignRepository: CampaignRepository,
    private val stepRepository: CampaignStepRepository
) : CommandLineRunner {

    private val logger = LoggerFactory.getLogger(MarketingTemplateInitializer::class.java)

    @Transactional
    override fun run(vararg args: String) {
        // Check if templates already exist
        val existingTemplates = campaignRepository.countTemplates()
        if (existingTemplates > 0) {
            logger.info("Marketing templates already exist ($existingTemplates templates), skipping initialization")
            return
        }

        logger.info("Initializing marketing campaign templates...")

        createWelcomeSequenceTemplate()
        createExpiryReminderTemplates()
        createWinBackTemplates()
        createBirthdayTemplate()
        createInactivityTemplates()

        logger.info("Marketing templates initialized successfully")
    }

    private fun createWelcomeSequenceTemplate() {
        val campaign = Campaign(
            name = "Welcome Sequence",
            description = "Welcome new members with a 3-step email sequence over 7 days",
            campaignType = CampaignType.WELCOME_SEQUENCE,
            triggerType = TriggerType.MEMBER_CREATED,
            isTemplate = true
        )
        val saved = campaignRepository.save(campaign)

        // Day 0: Welcome email
        stepRepository.save(
            CampaignStep.create(
                campaignId = saved.id,
                stepNumber = 1,
                name = "Welcome Email",
                channel = MarketingChannel.EMAIL,
                subjectEn = "Welcome to {{clubName}}!",
                subjectAr = "مرحباً بك في {{clubName}}!",
                bodyEn = """
                    Hi {{firstName}},

                    Welcome to {{clubName}}! We're thrilled to have you join our fitness family.

                    Here's what you can do next:
                    - Download our app to book classes
                    - Check out our class schedule
                    - Meet our trainers

                    If you have any questions, don't hesitate to reach out.

                    See you at the gym!
                    The {{clubName}} Team
                """.trimIndent(),
                bodyAr = """
                    مرحباً {{firstName}}،

                    مرحباً بك في {{clubName}}! نحن سعداء بانضمامك إلى عائلة اللياقة البدنية لدينا.

                    إليك ما يمكنك فعله بعد ذلك:
                    - حمّل تطبيقنا لحجز الحصص
                    - تفقد جدول الحصص
                    - تعرف على مدربينا

                    إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.

                    نراك في النادي!
                    فريق {{clubName}}
                """.trimIndent(),
                delayDays = 0,
                delayHours = 0
            )
        )

        // Day 3: Tips email
        stepRepository.save(
            CampaignStep.create(
                campaignId = saved.id,
                stepNumber = 2,
                name = "Getting Started Tips",
                channel = MarketingChannel.EMAIL,
                subjectEn = "Tips to get the most from your membership",
                subjectAr = "نصائح للاستفادة القصوى من عضويتك",
                bodyEn = """
                    Hi {{firstName}},

                    It's been a few days since you joined us. Here are some tips to help you get started:

                    1. Start with group classes - they're fun and motivating
                    2. Set realistic goals - consistency beats intensity
                    3. Don't skip warm-ups - they prevent injuries
                    4. Stay hydrated throughout your workout

                    Need help creating a workout plan? Our trainers are here to help!

                    Best,
                    The {{clubName}} Team
                """.trimIndent(),
                bodyAr = """
                    مرحباً {{firstName}}،

                    مرت بضعة أيام منذ انضمامك إلينا. إليك بعض النصائح لمساعدتك على البدء:

                    1. ابدأ بالحصص الجماعية - فهي ممتعة ومحفزة
                    2. ضع أهدافًا واقعية - الاستمرارية أفضل من الشدة
                    3. لا تتخطى الإحماء - فهو يمنع الإصابات
                    4. حافظ على ترطيب جسمك طوال التمرين

                    تحتاج مساعدة في إنشاء خطة تمرين؟ مدربونا هنا للمساعدة!

                    مع أطيب التحيات،
                    فريق {{clubName}}
                """.trimIndent(),
                delayDays = 3,
                delayHours = 0
            )
        )

        // Day 7: Check-in email
        stepRepository.save(
            CampaignStep.create(
                campaignId = saved.id,
                stepNumber = 3,
                name = "Week 1 Check-in",
                channel = MarketingChannel.EMAIL,
                subjectEn = "How's your first week going?",
                subjectAr = "كيف يسير أسبوعك الأول؟",
                bodyEn = """
                    Hi {{firstName}},

                    It's been a week since you joined {{clubName}}! How's it going?

                    We'd love to hear about your experience so far. If you have any feedback or questions, just reply to this email.

                    Remember, building a fitness habit takes time. Keep showing up, and the results will follow!

                    Cheering you on,
                    The {{clubName}} Team
                """.trimIndent(),
                bodyAr = """
                    مرحباً {{firstName}}،

                    مر أسبوع منذ انضمامك إلى {{clubName}}! كيف تسير الأمور؟

                    نود أن نسمع عن تجربتك حتى الآن. إذا كان لديك أي ملاحظات أو أسئلة، فقط رد على هذا البريد الإلكتروني.

                    تذكر، بناء عادة اللياقة البدنية يستغرق وقتًا. استمر في الحضور، وستأتي النتائج!

                    نشجعك،
                    فريق {{clubName}}
                """.trimIndent(),
                delayDays = 7,
                delayHours = 0
            )
        )

        logger.info("Created Welcome Sequence template")
    }

    private fun createExpiryReminderTemplates() {
        // 30-day expiry reminder
        createExpiryReminderTemplate(
            days = 30,
            name = "30-Day Expiry Reminder",
            description = "Remind members 30 days before their subscription expires",
            subjectEn = "Your subscription expires in 30 days",
            subjectAr = "اشتراكك ينتهي خلال 30 يوماً",
            bodyEn = """
                Hi {{firstName}},

                Just a friendly reminder that your {{clubName}} subscription will expire in 30 days.

                Renew now to:
                - Keep your current rate locked in
                - Maintain your fitness streak
                - Continue accessing all club facilities

                Renew early and don't miss a day of your fitness journey!

                Best regards,
                The {{clubName}} Team
            """.trimIndent(),
            bodyAr = """
                مرحباً {{firstName}}،

                مجرد تذكير ودي بأن اشتراكك في {{clubName}} سينتهي خلال 30 يوماً.

                جدد الآن لـ:
                - الحفاظ على سعرك الحالي
                - الحفاظ على استمراريتك في اللياقة
                - الاستمرار في الوصول إلى جميع مرافق النادي

                جدد مبكراً ولا تفوت يوماً من رحلة لياقتك!

                مع أطيب التحيات،
                فريق {{clubName}}
            """.trimIndent()
        )

        // 7-day expiry reminder
        createExpiryReminderTemplate(
            days = 7,
            name = "7-Day Expiry Reminder",
            description = "Urgent reminder 7 days before subscription expires",
            subjectEn = "Only 7 days left on your subscription!",
            subjectAr = "باقي 7 أيام فقط على اشتراكك!",
            bodyEn = """
                Hi {{firstName}},

                Your {{clubName}} subscription expires in just 7 days!

                Don't let your fitness momentum slip away. Renew today to ensure uninterrupted access to:
                - All gym equipment
                - Group fitness classes
                - Personal training sessions

                Click here to renew now: [Renew Link]

                Questions? Reply to this email or visit the front desk.

                The {{clubName}} Team
            """.trimIndent(),
            bodyAr = """
                مرحباً {{firstName}}،

                اشتراكك في {{clubName}} ينتهي خلال 7 أيام فقط!

                لا تدع زخم لياقتك يتلاشى. جدد اليوم لضمان الوصول المستمر إلى:
                - جميع معدات النادي
                - حصص اللياقة الجماعية
                - جلسات التدريب الشخصي

                انقر هنا للتجديد الآن: [رابط التجديد]

                أسئلة؟ رد على هذا البريد أو زر مكتب الاستقبال.

                فريق {{clubName}}
            """.trimIndent()
        )

        // 1-day expiry reminder
        createExpiryReminderTemplate(
            days = 1,
            name = "Final Expiry Reminder",
            description = "Final reminder 1 day before subscription expires",
            subjectEn = "FINAL NOTICE: Your subscription expires tomorrow!",
            subjectAr = "إشعار أخير: اشتراكك ينتهي غداً!",
            bodyEn = """
                Hi {{firstName}},

                This is your final reminder - your {{clubName}} subscription expires TOMORROW!

                Renew now to avoid any interruption to your workouts.

                [RENEW NOW]

                If you have any concerns about renewing, please reach out. We'd love to help!

                The {{clubName}} Team
            """.trimIndent(),
            bodyAr = """
                مرحباً {{firstName}}،

                هذا تذكيرك الأخير - اشتراكك في {{clubName}} ينتهي غداً!

                جدد الآن لتجنب أي انقطاع في تمارينك.

                [جدد الآن]

                إذا كان لديك أي مخاوف بشأن التجديد، يرجى التواصل معنا. نحن سعداء بالمساعدة!

                فريق {{clubName}}
            """.trimIndent()
        )

        logger.info("Created Expiry Reminder templates")
    }

    private fun createExpiryReminderTemplate(
        days: Int,
        name: String,
        description: String,
        subjectEn: String,
        subjectAr: String,
        bodyEn: String,
        bodyAr: String
    ) {
        val campaign = Campaign(
            name = name,
            description = description,
            campaignType = CampaignType.EXPIRY_REMINDER,
            triggerType = TriggerType.DAYS_BEFORE_EXPIRY,
            triggerConfig = TriggerConfig(days = days),
            isTemplate = true
        )
        val saved = campaignRepository.save(campaign)

        stepRepository.save(
            CampaignStep.create(
                campaignId = saved.id,
                stepNumber = 1,
                name = "Expiry Reminder",
                channel = MarketingChannel.EMAIL,
                subjectEn = subjectEn,
                subjectAr = subjectAr,
                bodyEn = bodyEn,
                bodyAr = bodyAr,
                delayDays = 0,
                delayHours = 0
            )
        )
    }

    private fun createWinBackTemplates() {
        // 7-day win-back
        createWinBackTemplate(
            days = 7,
            name = "7-Day Win-Back",
            description = "Win back members 7 days after subscription expired",
            subjectEn = "We miss you at {{clubName}}!",
            subjectAr = "نفتقدك في {{clubName}}!",
            bodyEn = """
                Hi {{firstName}},

                We noticed your subscription has expired. We miss seeing you at the gym!

                Your fitness journey doesn't have to pause. Come back and pick up where you left off.

                We're here to help you reach your goals. Ready to get back on track?

                Best regards,
                The {{clubName}} Team
            """.trimIndent(),
            bodyAr = """
                مرحباً {{firstName}}،

                لاحظنا أن اشتراكك قد انتهى. نفتقد رؤيتك في النادي!

                رحلة لياقتك لا يجب أن تتوقف. عد واستمر من حيث توقفت.

                نحن هنا لمساعدتك على تحقيق أهدافك. مستعد للعودة إلى المسار الصحيح؟

                مع أطيب التحيات،
                فريق {{clubName}}
            """.trimIndent()
        )

        // 30-day win-back
        createWinBackTemplate(
            days = 30,
            name = "30-Day Win-Back with Offer",
            description = "Win back members 30 days after expiry with special offer",
            subjectEn = "Special offer just for you, {{firstName}}!",
            subjectAr = "عرض خاص لك فقط، {{firstName}}!",
            bodyEn = """
                Hi {{firstName}},

                It's been a month since we last saw you at {{clubName}}. We'd love to have you back!

                As a valued former member, we're offering you a SPECIAL COMEBACK DEAL:
                [Insert your offer here]

                This exclusive offer is available for a limited time. Don't miss out!

                [CLAIM YOUR OFFER]

                See you soon,
                The {{clubName}} Team
            """.trimIndent(),
            bodyAr = """
                مرحباً {{firstName}}،

                مر شهر منذ آخر مرة رأيناك فيها في {{clubName}}. نود أن تعود إلينا!

                كعضو سابق مميز، نقدم لك صفقة خاصة للعودة:
                [أدخل عرضك هنا]

                هذا العرض الحصري متاح لفترة محدودة. لا تفوته!

                [احصل على عرضك]

                نراك قريباً،
                فريق {{clubName}}
            """.trimIndent()
        )

        // 90-day win-back
        createWinBackTemplate(
            days = 90,
            name = "90-Day Win-Back Best Offer",
            description = "Win back members 90 days after expiry with best offer",
            subjectEn = "{{firstName}}, we have our BEST offer for you",
            subjectAr = "{{firstName}}، لدينا أفضل عرض لك",
            bodyEn = """
                Hi {{firstName}},

                It's been a while since you've visited {{clubName}}, and we truly miss having you as part of our community.

                We want to make it as easy as possible for you to return, so we're offering you our BEST DEAL of the year:
                [Insert your best offer here]

                Your health and fitness goals are still within reach. Let's work together to achieve them!

                This is our best offer - take advantage of it today.

                [GET STARTED AGAIN]

                Warmly,
                The {{clubName}} Team
            """.trimIndent(),
            bodyAr = """
                مرحباً {{firstName}}،

                مضى وقت طويل منذ زيارتك لـ {{clubName}}، ونحن نفتقدك حقاً كجزء من مجتمعنا.

                نريد أن نجعل عودتك سهلة قدر الإمكان، لذلك نقدم لك أفضل عرض لدينا هذا العام:
                [أدخل أفضل عرض لديك هنا]

                أهداف صحتك ولياقتك لا تزال في متناول يدك. دعنا نعمل معاً لتحقيقها!

                هذا أفضل عرض لدينا - استفد منه اليوم.

                [ابدأ من جديد]

                بحرارة،
                فريق {{clubName}}
            """.trimIndent()
        )

        logger.info("Created Win-Back templates")
    }

    private fun createWinBackTemplate(
        days: Int,
        name: String,
        description: String,
        subjectEn: String,
        subjectAr: String,
        bodyEn: String,
        bodyAr: String
    ) {
        val campaign = Campaign(
            name = name,
            description = description,
            campaignType = CampaignType.WIN_BACK,
            triggerType = TriggerType.DAYS_AFTER_EXPIRY,
            triggerConfig = TriggerConfig(days = days),
            isTemplate = true
        )
        val saved = campaignRepository.save(campaign)

        stepRepository.save(
            CampaignStep.create(
                campaignId = saved.id,
                stepNumber = 1,
                name = "Win-Back Message",
                channel = MarketingChannel.EMAIL,
                subjectEn = subjectEn,
                subjectAr = subjectAr,
                bodyEn = bodyEn,
                bodyAr = bodyAr,
                delayDays = 0,
                delayHours = 0
            )
        )
    }

    private fun createBirthdayTemplate() {
        val campaign = Campaign(
            name = "Birthday Greeting",
            description = "Send birthday wishes to members on their special day",
            campaignType = CampaignType.BIRTHDAY,
            triggerType = TriggerType.BIRTHDAY,
            isTemplate = true
        )
        val saved = campaignRepository.save(campaign)

        stepRepository.save(
            CampaignStep.create(
                campaignId = saved.id,
                stepNumber = 1,
                name = "Birthday Wish",
                channel = MarketingChannel.EMAIL,
                subjectEn = "Happy Birthday, {{firstName}}! \uD83C\uDF89",
                subjectAr = "عيد ميلاد سعيد، {{firstName}}! \uD83C\uDF89",
                bodyEn = """
                    Happy Birthday, {{firstName}}!

                    Everyone at {{clubName}} wishes you an amazing birthday filled with joy and happiness!

                    As a birthday gift from us, enjoy:
                    [Insert birthday offer/discount here]

                    Wishing you health, happiness, and many more years of fitness!

                    Warm wishes,
                    The {{clubName}} Team
                """.trimIndent(),
                bodyAr = """
                    عيد ميلاد سعيد، {{firstName}}!

                    الجميع في {{clubName}} يتمنون لك عيد ميلاد رائع مليء بالفرح والسعادة!

                    كهدية عيد ميلاد منا، استمتع بـ:
                    [أدخل عرض/خصم عيد الميلاد هنا]

                    نتمنى لك الصحة والسعادة والمزيد من سنوات اللياقة!

                    مع أطيب التمنيات،
                    فريق {{clubName}}
                """.trimIndent(),
                delayDays = 0,
                delayHours = 0
            )
        )

        logger.info("Created Birthday template")
    }

    private fun createInactivityTemplates() {
        // 14-day inactivity
        createInactivityTemplate(
            days = 14,
            name = "14-Day Inactivity Alert",
            description = "Re-engage members who haven't visited for 14 days",
            subjectEn = "We haven't seen you in a while, {{firstName}}",
            subjectAr = "لم نرك منذ فترة، {{firstName}}",
            bodyEn = """
                Hi {{firstName}},

                We noticed it's been about 2 weeks since your last visit to {{clubName}}.

                Life gets busy, and that's okay! But remember, even a short workout can make a big difference.

                Here are some tips to get back on track:
                - Start small - even 20 minutes counts
                - Try a new class to mix things up
                - Bring a friend for extra motivation

                We're here whenever you're ready to return!

                The {{clubName}} Team
            """.trimIndent(),
            bodyAr = """
                مرحباً {{firstName}}،

                لاحظنا أنه مر حوالي أسبوعين منذ آخر زيارة لك لـ {{clubName}}.

                الحياة مشغولة، وهذا مقبول! لكن تذكر، حتى التمرين القصير يمكن أن يحدث فرقاً كبيراً.

                إليك بعض النصائح للعودة إلى المسار الصحيح:
                - ابدأ صغيراً - حتى 20 دقيقة تُحسب
                - جرب حصة جديدة لتغيير الأجواء
                - أحضر صديقاً للحصول على دافع إضافي

                نحن هنا متى ما كنت مستعداً للعودة!

                فريق {{clubName}}
            """.trimIndent()
        )

        // 30-day inactivity
        createInactivityTemplate(
            days = 30,
            name = "30-Day Inactivity - PT Offer",
            description = "Offer personal training session to members inactive for 30 days",
            subjectEn = "Let's get you back on track, {{firstName}}",
            subjectAr = "لنعيدك إلى المسار الصحيح، {{firstName}}",
            bodyEn = """
                Hi {{firstName}},

                It's been a month since we last saw you at {{clubName}}. We understand that staying consistent can be challenging.

                Sometimes, a little extra support can make all the difference. That's why we'd like to offer you:

                A COMPLIMENTARY PERSONAL TRAINING SESSION

                Our certified trainers can help you:
                - Create a realistic fitness plan
                - Learn proper form and techniques
                - Stay motivated and accountable

                Ready to get back on track? Reply to this email or visit the front desk to schedule your free session.

                We believe in you!
                The {{clubName}} Team
            """.trimIndent(),
            bodyAr = """
                مرحباً {{firstName}}،

                مر شهر منذ آخر مرة رأيناك فيها في {{clubName}}. نحن نتفهم أن الاستمرارية قد تكون صعبة.

                أحياناً، القليل من الدعم الإضافي يمكن أن يحدث فرقاً كبيراً. لهذا السبب نود أن نقدم لك:

                جلسة تدريب شخصي مجانية

                مدربونا المعتمدون يمكنهم مساعدتك في:
                - إنشاء خطة لياقة واقعية
                - تعلم الوضعية والتقنيات الصحيحة
                - البقاء متحمساً ومسؤولاً

                مستعد للعودة إلى المسار الصحيح؟ رد على هذا البريد الإلكتروني أو زر مكتب الاستقبال لحجز جلستك المجانية.

                نحن نؤمن بك!
                فريق {{clubName}}
            """.trimIndent()
        )

        logger.info("Created Inactivity templates")
    }

    private fun createInactivityTemplate(
        days: Int,
        name: String,
        description: String,
        subjectEn: String,
        subjectAr: String,
        bodyEn: String,
        bodyAr: String
    ) {
        val campaign = Campaign(
            name = name,
            description = description,
            campaignType = CampaignType.INACTIVITY_ALERT,
            triggerType = TriggerType.DAYS_INACTIVE,
            triggerConfig = TriggerConfig(days = days),
            isTemplate = true
        )
        val saved = campaignRepository.save(campaign)

        stepRepository.save(
            CampaignStep.create(
                campaignId = saved.id,
                stepNumber = 1,
                name = "Inactivity Alert",
                channel = MarketingChannel.EMAIL,
                subjectEn = subjectEn,
                subjectAr = subjectAr,
                bodyEn = bodyEn,
                bodyAr = bodyAr,
                delayDays = 0,
                delayHours = 0
            )
        )
    }
}

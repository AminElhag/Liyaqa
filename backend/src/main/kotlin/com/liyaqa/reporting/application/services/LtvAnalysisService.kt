package com.liyaqa.reporting.application.services

import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.reporting.application.commands.LtvReportFilters
import com.liyaqa.reporting.application.commands.LtvSegment
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.util.*

@Service
@Transactional(readOnly = true)
class LtvAnalysisService(
    private val memberRepository: MemberRepository,
    private val invoiceRepository: InvoiceRepository,
    private val subscriptionRepository: SubscriptionRepository
) {
    private val logger = LoggerFactory.getLogger(LtvAnalysisService::class.java)

    data class LtvReportData(
        val period: String,
        val startDate: LocalDate,
        val endDate: LocalDate,
        val totalMembers: Long,
        val averageLtv: BigDecimal,
        val medianLtv: BigDecimal,
        val totalRevenue: BigDecimal,
        val averageLifespanMonths: BigDecimal,
        val ltvBySegment: List<LtvBySegment>,
        val ltvDistribution: List<LtvBucket>,
        val topMembers: List<MemberLtv>
    )

    data class LtvBySegment(
        val segmentId: String,
        val segmentName: String,
        val segmentNameAr: String?,
        val memberCount: Long,
        val averageLtv: BigDecimal,
        val totalRevenue: BigDecimal
    )

    data class LtvBucket(
        val rangeMin: BigDecimal,
        val rangeMax: BigDecimal,
        val label: String,
        val count: Long,
        val percentage: BigDecimal
    )

    data class MemberLtv(
        val memberId: UUID,
        val memberName: String,
        val ltv: BigDecimal,
        val lifespanMonths: Int,
        val transactionCount: Int
    )

    fun generateLtvReport(filters: LtvReportFilters): LtvReportData {
        logger.info("Generating LTV report for ${filters.startDate} to ${filters.endDate}")

        // Get all members who joined before the end date
        val memberLtvData = calculateMemberLtvs(filters.endDate)

        val totalMembers = memberLtvData.size.toLong()
        val totalRevenue = memberLtvData.sumOf { it.ltv }
        val averageLtv = if (totalMembers > 0) {
            totalRevenue.divide(BigDecimal(totalMembers), 2, RoundingMode.HALF_UP)
        } else BigDecimal.ZERO

        val sortedLtvs = memberLtvData.map { it.ltv }.sorted()
        val medianLtv = if (sortedLtvs.isNotEmpty()) {
            sortedLtvs[sortedLtvs.size / 2]
        } else BigDecimal.ZERO

        val avgLifespan = if (memberLtvData.isNotEmpty()) {
            BigDecimal(memberLtvData.sumOf { it.lifespanMonths })
                .divide(BigDecimal(totalMembers), 1, RoundingMode.HALF_UP)
        } else BigDecimal.ZERO

        // Segment analysis
        val ltvBySegment = calculateLtvBySegment(memberLtvData, filters.segmentBy)

        // Distribution buckets
        val ltvDistribution = calculateLtvDistribution(memberLtvData)

        // Top members
        val topMembers = memberLtvData.sortedByDescending { it.ltv }.take(10)

        return LtvReportData(
            period = "${filters.startDate} - ${filters.endDate}",
            startDate = filters.startDate,
            endDate = filters.endDate,
            totalMembers = totalMembers,
            averageLtv = averageLtv,
            medianLtv = medianLtv,
            totalRevenue = totalRevenue,
            averageLifespanMonths = avgLifespan,
            ltvBySegment = ltvBySegment,
            ltvDistribution = ltvDistribution,
            topMembers = topMembers
        )
    }

    private fun calculateMemberLtvs(asOfDate: LocalDate): List<MemberLtv> {
        return invoiceRepository.getMemberLtvData(asOfDate).map { row ->
            MemberLtv(
                memberId = row["memberId"] as UUID,
                memberName = row["memberName"] as? String ?: "Unknown",
                ltv = (row["totalRevenue"] as? BigDecimal) ?: BigDecimal.ZERO,
                lifespanMonths = (row["lifespanMonths"] as? Number)?.toInt() ?: 0,
                transactionCount = (row["transactionCount"] as? Number)?.toInt() ?: 0
            )
        }
    }

    private fun calculateLtvBySegment(memberData: List<MemberLtv>, segmentBy: LtvSegment): List<LtvBySegment> {
        // Simplified segmentation - in production, would join with member/subscription data
        val segments = when (segmentBy) {
            LtvSegment.PLAN -> listOf(
                LtvBySegment("monthly", "Monthly Plan", "الخطة الشهرية", 0, BigDecimal.ZERO, BigDecimal.ZERO),
                LtvBySegment("quarterly", "Quarterly Plan", "الخطة الربعية", 0, BigDecimal.ZERO, BigDecimal.ZERO),
                LtvBySegment("annual", "Annual Plan", "الخطة السنوية", 0, BigDecimal.ZERO, BigDecimal.ZERO)
            )
            LtvSegment.GENDER -> listOf(
                LtvBySegment("male", "Male", "ذكر", 0, BigDecimal.ZERO, BigDecimal.ZERO),
                LtvBySegment("female", "Female", "أنثى", 0, BigDecimal.ZERO, BigDecimal.ZERO)
            )
            LtvSegment.JOIN_MONTH -> memberData.groupBy { it.lifespanMonths / 12 }
                .map { (years, members) ->
                    val total = members.sumOf { it.ltv }
                    val avg = if (members.isNotEmpty()) {
                        total.divide(BigDecimal(members.size), 2, RoundingMode.HALF_UP)
                    } else BigDecimal.ZERO
                    LtvBySegment(
                        "year_$years",
                        "Year ${years + 1}",
                        "السنة ${years + 1}",
                        members.size.toLong(),
                        avg,
                        total
                    )
                }
            LtvSegment.LOCATION -> listOf(
                LtvBySegment("main", "Main Branch", "الفرع الرئيسي", 0, BigDecimal.ZERO, BigDecimal.ZERO)
            )
        }

        return segments
    }

    private fun calculateLtvDistribution(memberData: List<MemberLtv>): List<LtvBucket> {
        val buckets = listOf(
            Triple(BigDecimal.ZERO, BigDecimal(500), "0 - 500 SAR"),
            Triple(BigDecimal(500), BigDecimal(1000), "500 - 1,000 SAR"),
            Triple(BigDecimal(1000), BigDecimal(2500), "1,000 - 2,500 SAR"),
            Triple(BigDecimal(2500), BigDecimal(5000), "2,500 - 5,000 SAR"),
            Triple(BigDecimal(5000), BigDecimal(10000), "5,000 - 10,000 SAR"),
            Triple(BigDecimal(10000), BigDecimal(999999), "10,000+ SAR")
        )

        val total = memberData.size.toDouble()

        return buckets.map { (min, max, label) ->
            val count = memberData.count { it.ltv >= min && it.ltv < max }.toLong()
            val percentage = if (total > 0) {
                BigDecimal(count * 100 / total).setScale(1, RoundingMode.HALF_UP)
            } else BigDecimal.ZERO

            LtvBucket(min, max, label, count, percentage)
        }
    }
}

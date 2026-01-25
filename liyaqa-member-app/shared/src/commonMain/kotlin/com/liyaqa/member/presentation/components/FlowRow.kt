package com.liyaqa.member.presentation.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * A simple flow row layout that wraps content to the next line when it doesn't fit.
 */
@Composable
fun FlowRow(
    modifier: Modifier = Modifier,
    horizontalSpacing: Dp = 8.dp,
    verticalSpacing: Dp = 8.dp,
    content: @Composable () -> Unit
) {
    Layout(
        content = content,
        modifier = modifier
    ) { measurables, constraints ->
        val horizontalSpacingPx = horizontalSpacing.roundToPx()
        val verticalSpacingPx = verticalSpacing.roundToPx()

        val placeables = measurables.map { measurable ->
            measurable.measure(constraints.copy(minWidth = 0, minHeight = 0))
        }

        val rows = mutableListOf<List<Placeable>>()
        var currentRow = mutableListOf<Placeable>()
        var currentRowWidth = 0

        placeables.forEach { placeable ->
            val itemWidth = placeable.width + if (currentRow.isNotEmpty()) horizontalSpacingPx else 0

            if (currentRowWidth + itemWidth > constraints.maxWidth && currentRow.isNotEmpty()) {
                rows.add(currentRow.toList())
                currentRow = mutableListOf()
                currentRowWidth = 0
            }

            currentRow.add(placeable)
            currentRowWidth += itemWidth
        }

        if (currentRow.isNotEmpty()) {
            rows.add(currentRow)
        }

        val width = constraints.maxWidth
        val height = if (rows.isEmpty()) {
            0
        } else {
            rows.sumOf { row -> row.maxOfOrNull { it.height } ?: 0 } +
                    (rows.size - 1) * verticalSpacingPx
        }

        layout(width, height) {
            var y = 0

            rows.forEach { row ->
                var x = 0
                val rowHeight = row.maxOfOrNull { it.height } ?: 0

                row.forEach { placeable ->
                    placeable.placeRelative(x, y)
                    x += placeable.width + horizontalSpacingPx
                }

                y += rowHeight + verticalSpacingPx
            }
        }
    }
}

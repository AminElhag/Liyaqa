package com.liyaqa

import com.liyaqa.config.TestContainersConfiguration
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles

@SpringBootTest
@ActiveProfiles("test")
@Import(TestContainersConfiguration::class)
class LiyaqaApplicationTests {

    @Test
    fun contextLoads() {
    }
}

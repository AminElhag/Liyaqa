package com.liyaqa.shared.validation

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class SaudiValidatorsTest {

    // ==================== Saudi CR Validator ====================

    private val crValidator = SaudiCRValidator()

    @Test
    fun `valid CR numbers are accepted`() {
        assertTrue(crValidator.isValid("1234567890", null))
        assertTrue(crValidator.isValid("0000000000", null))
        assertTrue(crValidator.isValid("9999999999", null))
    }

    @Test
    fun `invalid CR numbers are rejected`() {
        assertFalse(crValidator.isValid("123456789", null))   // 9 digits
        assertFalse(crValidator.isValid("12345678901", null)) // 11 digits
        assertFalse(crValidator.isValid("123456789a", null))  // contains letter
        assertFalse(crValidator.isValid("", null))            // empty
        assertFalse(crValidator.isValid("12345 6789", null))  // contains space
    }

    @Test
    fun `null CR is valid`() {
        assertTrue(crValidator.isValid(null, null))
    }

    // ==================== Saudi VAT Validator ====================

    private val vatValidator = SaudiVATValidator()

    @Test
    fun `valid VAT numbers are accepted`() {
        assertTrue(vatValidator.isValid("300000000000003", null))  // starts and ends with 3
        assertTrue(vatValidator.isValid("310000000000003", null))
        assertTrue(vatValidator.isValid("399999999999993", null))
    }

    @Test
    fun `invalid VAT numbers are rejected`() {
        assertFalse(vatValidator.isValid("200000000000003", null))  // doesn't start with 3
        assertFalse(vatValidator.isValid("300000000000002", null))  // doesn't end with 3
        assertFalse(vatValidator.isValid("30000000000003", null))   // 14 digits
        assertFalse(vatValidator.isValid("3000000000000030", null)) // 16 digits
        assertFalse(vatValidator.isValid("", null))                 // empty
        assertFalse(vatValidator.isValid("3000000000000a3", null))  // contains letter
    }

    @Test
    fun `null VAT is valid`() {
        assertTrue(vatValidator.isValid(null, null))
    }

    // ==================== Saudi Phone Validator ====================

    private val phoneValidator = SaudiPhoneValidator()

    @Test
    fun `valid Saudi phone numbers with +966 prefix are accepted`() {
        assertTrue(phoneValidator.isValid("+966500000000", null))
        assertTrue(phoneValidator.isValid("+966599999999", null))
        assertTrue(phoneValidator.isValid("+966512345678", null))
    }

    @Test
    fun `valid Saudi phone numbers with 00966 prefix are accepted`() {
        assertTrue(phoneValidator.isValid("00966500000000", null))
        assertTrue(phoneValidator.isValid("00966599999999", null))
    }

    @Test
    fun `valid Saudi phone numbers with 05 prefix are accepted`() {
        assertTrue(phoneValidator.isValid("0500000000", null))
        assertTrue(phoneValidator.isValid("0599999999", null))
    }

    @Test
    fun `valid Saudi phone numbers without prefix are accepted`() {
        assertTrue(phoneValidator.isValid("500000000", null))
        assertTrue(phoneValidator.isValid("599999999", null))
    }

    @Test
    fun `invalid Saudi phone numbers are rejected`() {
        assertFalse(phoneValidator.isValid("+966400000000", null))  // not starting with 5
        assertFalse(phoneValidator.isValid("+96650000000", null))   // too short
        assertFalse(phoneValidator.isValid("+9665000000000", null)) // too long
        assertFalse(phoneValidator.isValid("0600000000", null))     // not starting with 5
        assertFalse(phoneValidator.isValid("", null))               // empty
        assertFalse(phoneValidator.isValid("+966 500000000", null)) // contains space
    }

    @Test
    fun `null phone is valid`() {
        assertTrue(phoneValidator.isValid(null, null))
    }
}

import unittest
from unittest.mock import patch
import sys
import os

# Add the current directory to Python path to import our module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the function we want to test (this will fail initially)
try:
    from leap_year import is_leap_year
except ImportError:
    # If the module doesn't exist, we'll create a placeholder that always fails
    def is_leap_year(year):
        raise NotImplementedError("is_leap_year function not implemented yet")


class TestIsLeapYear(unittest.TestCase):
    """
    Test cases for the is_leap_year function.
    
    Leap year rules:
    1. If a year is divisible by 400, it is a leap year
    2. If a year is divisible by 100 but not 400, it is NOT a leap year
    3. If a year is divisible by 4 but not 100, it is a leap year
    4. If a year is not divisible by 4, it is NOT a leap year
    """

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.leap_years = [2000, 2004, 2008, 2012, 2016, 2020, 2024, 1600, 1200]
        self.non_leap_years = [1900, 1800, 1700, 2001, 2002, 2003, 2023, 2025, 2026]

    def tearDown(self):
        """Clean up after each test method."""
        pass

    def test_year_divisible_by_400(self):
        """Test years that are divisible by 400 (should be leap years)."""
        test_cases = [
            (2000, True, "Year 2000 should be a leap year (divisible by 400)"),
            (1600, True, "Year 1600 should be a leap year (divisible by 400)"),
            (2400, True, "Year 2400 should be a leap year (divisible by 400)"),
            (1200, True, "Year 1200 should be a leap year (divisible by 400)"),
            (800, True, "Year 800 should be a leap year (divisible by 400)"),
        ]
        
        for year, expected, message in test_cases:
            with self.subTest(year=year):
                self.assertEqual(is_leap_year(year), expected, message)

    def test_year_divisible_by_100_but_not_400(self):
        """Test years divisible by 100 but not 400 (should NOT be leap years)."""
        test_cases = [
            (1900, False, "Year 1900 should NOT be a leap year (divisible by 100 but not 400)"),
            (1800, False, "Year 1800 should NOT be a leap year (divisible by 100 but not 400)"),
            (1700, False, "Year 1700 should NOT be a leap year (divisible by 100 but not 400)"),
            (2100, False, "Year 2100 should NOT be a leap year (divisible by 100 but not 400)"),
            (2200, False, "Year 2200 should NOT be a leap year (divisible by 100 but not 400)"),
            (2300, False, "Year 2300 should NOT be a leap year (divisible by 100 but not 400)"),
        ]
        
        for year, expected, message in test_cases:
            with self.subTest(year=year):
                self.assertEqual(is_leap_year(year), expected, message)

    def test_year_divisible_by_4_but_not_100(self):
        """Test years divisible by 4 but not 100 (should be leap years)."""
        test_cases = [
            (2024, True, "Year 2024 should be a leap year (divisible by 4 but not 100)"),
            (2020, True, "Year 2020 should be a leap year (divisible by 4 but not 100)"),
            (2016, True, "Year 2016 should be a leap year (divisible by 4 but not 100)"),
            (2012, True, "Year 2012 should be a leap year (divisible by 4 but not 100)"),
            (2008, True, "Year 2008 should be a leap year (divisible by 4 but not 100)"),
            (2004, True, "Year 2004 should be a leap year (divisible by 4 but not 100)"),
            (1996, True, "Year 1996 should be a leap year (divisible by 4 but not 100)"),
            (1992, True, "Year 1992 should be a leap year (divisible by 4 but not 100)"),
        ]
        
        for year, expected, message in test_cases:
            with self.subTest(year=year):
                self.assertEqual(is_leap_year(year), expected, message)

    def test_year_not_divisible_by_4(self):
        """Test years not divisible by 4 (should NOT be leap years)."""
        test_cases = [
            (2023, False, "Year 2023 should NOT be a leap year (not divisible by 4)"),
            (2022, False, "Year 2022 should NOT be a leap year (not divisible by 4)"),
            (2021, False, "Year 2021 should NOT be a leap year (not divisible by 4)"),
            (2019, False, "Year 2019 should NOT be a leap year (not divisible by 4)"),
            (2018, False, "Year 2018 should NOT be a leap year (not divisible by 4)"),
            (2017, False, "Year 2017 should NOT be a leap year (not divisible by 4)"),
            (2015, False, "Year 2015 should NOT be a leap year (not divisible by 4)"),
            (2013, False, "Year 2013 should NOT be a leap year (not divisible by 4)"),
            (1999, False, "Year 1999 should NOT be a leap year (not divisible by 4)"),
            (1997, False, "Year 1997 should NOT be a leap year (not divisible by 4)"),
        ]
        
        for year, expected, message in test_cases:
            with self.subTest(year=year):
                self.assertEqual(is_leap_year(year), expected, message)

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Test year 0 (if applicable to your use case)
        with self.subTest("Year 0"):
            # Year 0 is divisible by 400, so it should be a leap year
            self.assertTrue(is_leap_year(0), "Year 0 should be a leap year")
        
        # Test year 4 (first positive leap year)
        with self.subTest("Year 4"):
            self.assertTrue(is_leap_year(4), "Year 4 should be a leap year")
        
        # Test year 1 (not divisible by 4)
        with self.subTest("Year 1"):
            self.assertFalse(is_leap_year(1), "Year 1 should NOT be a leap year")

    def test_return_type(self):
        """Test that the function returns a boolean value."""
        result = is_leap_year(2024)
        self.assertIsInstance(result, bool, "Function should return a boolean value")

    def test_negative_years(self):
        """Test behavior with negative years (if applicable)."""
        # Note: This depends on your requirements for handling negative years
        test_cases = [
            (-4, True, "Year -4 should be a leap year if negative years are supported"),
            (-1, False, "Year -1 should NOT be a leap year if negative years are supported"),
            (-100, False, "Year -100 should NOT be a leap year (divisible by 100 but not 400)"),
            (-400, True, "Year -400 should be a leap year (divisible by 400)"),
        ]
        
        for year, expected, message in test_cases:
            with self.subTest(year=year):
                try:
                    result = is_leap_year(year)
                    self.assertEqual(result, expected, message)
                except (ValueError, TypeError) as e:
                    # If the function doesn't support negative years, that's also valid
                    self.skipTest(f"Function doesn't support negative years: {e}")

    def test_invalid_input_types(self):
        """Test that the function handles invalid input types appropriately."""
        invalid_inputs = [
            ("2024", "String input should raise TypeError"),
            (2024.5, "Float input should raise TypeError"),
            (None, "None input should raise TypeError"),
            ([], "List input should raise TypeError"),
            ({}, "Dict input should raise TypeError"),
        ]
        
        for invalid_input, description in invalid_inputs:
            with self.subTest(input=invalid_input):
                with self.assertRaises((TypeError, ValueError), msg=description):
                    is_leap_year(invalid_input)

    def test_large_years(self):
        """Test with very large year values."""
        large_years = [
            (10000, False, "Year 10000 should NOT be a leap year"),
            (10004, True, "Year 10004 should be a leap year"),
            (100000, False, "Year 100000 should NOT be a leap year (divisible by 100 but not 400)"),
            (400000, True, "Year 400000 should be a leap year (divisible by 400)"),
        ]
        
        for year, expected, message in large_years:
            with self.subTest(year=year):
                self.assertEqual(is_leap_year(year), expected, message)

    def test_comprehensive_leap_year_pattern(self):
        """Test a comprehensive pattern of leap years over a longer period."""
        # Test a 400-year cycle (1600-1999) which contains the complete leap year pattern
        expected_leap_years_in_range = []
        expected_non_leap_years_in_range = []
        
        for year in range(1600, 2000):
            if (year % 400 == 0) or (year % 4 == 0 and year % 100 != 0):
                expected_leap_years_in_range.append(year)
            else:
                expected_non_leap_years_in_range.append(year)
        
        # Test some leap years from our calculated list
        for year in expected_leap_years_in_range[::10]:  # Test every 10th leap year
            with self.subTest(year=year):
                self.assertTrue(is_leap_year(year), f"Year {year} should be a leap year")
        
        # Test some non-leap years from our calculated list
        for year in expected_non_leap_years_in_range[::10]:  # Test every 10th non-leap year
            with self.subTest(year=year):
                self.assertFalse(is_leap_year(year), f"Year {year} should NOT be a leap year")


class TestLeapYearPerformance(unittest.TestCase):
    """Performance tests for the is_leap_year function."""
    
    def test_performance_with_many_years(self):
        """Test that the function performs well with many calls."""
        import time
        
        start_time = time.time()
        
        # Test 10,000 years
        for year in range(1, 10001):
            is_leap_year(year)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # The function should be very fast - let's say it should complete in under 1 second
        self.assertLess(execution_time, 1.0, 
                       f"Function took {execution_time:.4f} seconds for 10,000 calls, should be under 1 second")


def run_tests():
    """
    Function to run all tests with detailed output.
    """
    # Create a test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestIsLeapYear))
    suite.addTests(loader.loadTestsFromTestCase(TestLeapYearPerformance))
    
    # Run the tests with detailed output
    runner = unittest.TextTestRunner(verbosity=2, buffer=True)
    result = runner.run(suite)
    
    return result


if __name__ == '__main__':
    # Run the tests
    print("Running leap year function tests...")
    print("=" * 60)
    
    result = run_tests()
    
    print("\n" + "=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    
    if result.failures:
        print("\nFAILURES:")
        for test, failure in result.failures:
            print(f"- {test}: {failure}")
    
    if result.errors:
        print("\nERRORS:")
        for test, error in result.errors:
            print(f"- {test}: {error}")
    
    # Exit with appropriate code
    sys.exit(0 if result.wasSuccessful() else 1)
# Leap Year Function Unit Tests

This test suite provides comprehensive coverage for the `is_leap_year(year)` function using Python's `unittest` framework.

## Test Coverage

### Core Leap Year Rules Tests

1. **Years divisible by 400** (should be leap years)
   - Test cases: 2000, 1600, 2400, 1200, 800
   - These are leap years according to the Gregorian calendar

2. **Years divisible by 100 but not 400** (should NOT be leap years)
   - Test cases: 1900, 1800, 1700, 2100, 2200, 2300
   - These are NOT leap years despite being divisible by 4

3. **Years divisible by 4 but not 100** (should be leap years)
   - Test cases: 2024, 2020, 2016, 2012, 2008, 2004, 1996, 1992
   - Standard leap years

4. **Years not divisible by 4** (should NOT be leap years)
   - Test cases: 2023, 2022, 2021, 2019, 2018, 2017, 2015, 2013, 1999, 1997
   - Regular years

### Additional Test Categories

#### Edge Cases
- Year 0 (divisible by 400)
- Year 4 (first positive leap year)
- Year 1 (not divisible by 4)

#### Input Validation
- **Type checking**: String, float, None, list, dict inputs should raise TypeError
- **Return type**: Function should return boolean values

#### Boundary Testing
- **Negative years**: Tests behavior with negative years (optional feature)
- **Large years**: Tests with very large year values (10000, 100000, 400000)

#### Performance Testing
- Tests that the function completes 10,000 calls in under 1 second

#### Comprehensive Pattern Testing
- Tests a 400-year cycle to verify the complete leap year pattern

## Running the Tests

```bash
# Run all tests
python3 test_leap_year.py

# Run with pytest for more detailed output
pytest test_leap_year.py -v

# Run specific test classes
python3 -m unittest test_leap_year.TestIsLeapYear -v
python3 -m unittest test_leap_year.TestLeapYearPerformance -v
```

## Test Results (Initial State)

Since the `is_leap_year` function is initially not implemented (raises `NotImplementedError`), all tests will fail with the following error:

```
NotImplementedError: is_leap_year function not implemented yet
```

This demonstrates **Test-Driven Development (TDD)** principles:
1. Write tests first (they fail)
2. Implement the minimal code to make tests pass
3. Refactor while keeping tests green

## Expected Test Behavior

Once the function is correctly implemented, all tests should pass:

```
Tests run: 87
Failures: 0
Errors: 0
Skipped: 0
```

## Leap Year Logic

The correct implementation follows these rules:

```python
def is_leap_year(year):
    if year % 400 == 0:
        return True      # Divisible by 400: leap year
    elif year % 100 == 0:
        return False     # Divisible by 100 but not 400: not leap year
    elif year % 4 == 0:
        return True      # Divisible by 4 but not 100: leap year
    else:
        return False     # Not divisible by 4: not leap year
```

## Test Structure

- **TestIsLeapYear**: Main test class with core functionality tests
- **TestLeapYearPerformance**: Performance-specific tests
- **Subtests**: Used for testing multiple related cases efficiently
- **Error handling**: Comprehensive exception testing
- **Detailed assertions**: Each test includes descriptive failure messages

This test suite ensures robust validation of the leap year function across all edge cases and requirements.
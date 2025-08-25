"""
Leap year calculation module - CORRECT IMPLEMENTATION.

This module contains the correct implementation of the leap year function
to demonstrate how the tests should pass.
"""


def is_leap_year(year):
    """
    Determine if a given year is a leap year.
    
    Leap year rules:
    1. If a year is divisible by 400, it is a leap year
    2. If a year is divisible by 100 but not 400, it is NOT a leap year  
    3. If a year is divisible by 4 but not 100, it is a leap year
    4. If a year is not divisible by 4, it is NOT a leap year
    
    Args:
        year (int): The year to check
        
    Returns:
        bool: True if the year is a leap year, False otherwise
        
    Raises:
        TypeError: If year is not an integer
    """
    # Type validation
    if not isinstance(year, int):
        raise TypeError("Year must be an integer")
    
    # Leap year logic
    if year % 400 == 0:
        return True
    elif year % 100 == 0:
        return False
    elif year % 4 == 0:
        return True
    else:
        return False
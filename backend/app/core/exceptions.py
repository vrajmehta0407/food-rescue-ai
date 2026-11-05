from fastapi import HTTPException, status


class FoodRescueException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: str = "ERROR"):
        super().__init__(status_code=status_code, detail={"message": detail, "code": error_code})


class NotFoundError(FoodRescueException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail, error_code="NOT_FOUND")


class UnauthorizedError(FoodRescueException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, error_code="UNAUTHORIZED")


class ForbiddenError(FoodRescueException):
    def __init__(self, detail: str = "Permission denied"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail, error_code="FORBIDDEN")


class ConflictError(FoodRescueException):
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail, error_code="CONFLICT")


class BadRequestError(FoodRescueException):
    def __init__(self, detail: str = "Invalid request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail, error_code="BAD_REQUEST")


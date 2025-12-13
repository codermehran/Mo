import logging

from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.views import exception_handler


logger = logging.getLogger("beauty_platform.permissions")


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, (NotAuthenticated, PermissionDenied)):
        request = context.get("request")
        user = getattr(request, "user", None)
        logger.warning(
            "Permission error (%s) on %s: user=%s, method=%s",
            exc.__class__.__name__,
            getattr(request, "path", "unknown"),
            getattr(user, "id", None),
            getattr(request, "method", None),
        )

    return response

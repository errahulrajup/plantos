FROM alpine:3.18

RUN apk add --no-cache postgresql15-client bash

WORKDIR /app
COPY backup.sh .
RUN chmod +x backup.sh

# Run the backup script immediately for testing, 
# then loop to simulate a cron job in a basic container.
CMD ["/bin/bash", "-c", "./backup.sh && while true; do sleep 86400; ./backup.sh; done"]

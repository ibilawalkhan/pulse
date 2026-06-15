#!/bin/bash
# Creates the check-jobs queue and its DLQ on LocalStack startup.
set -euo pipefail

awslocal sqs create-queue --queue-name check-jobs-dlq

DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "http://localhost:4566/000000000000/check-jobs-dlq" \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' --output text)

awslocal sqs create-queue \
  --queue-name check-jobs \
  --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"${DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}"

echo "SQS queues created: check-jobs, check-jobs-dlq"

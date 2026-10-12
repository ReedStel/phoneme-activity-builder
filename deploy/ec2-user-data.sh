#!/bin/bash
#
# EC2 user data for the Phoneme Activity Builder.
#
# Paste this whole file into "Advanced details > User data" when launching an
# Amazon Linux 2023 instance in the AWS Academy Learner Lab. On first boot it
# runs the same steps as the Workshop 6 and Workshop 7 labs (Docker, Buildx,
# Docker Compose and Git), clones the project from GitHub and starts it with
# Compose on port 80, so the instance's public address opens the app.
#
# Progress is written to /var/log/phoneme-setup.log. Check it with:
#   sudo tail -f /var/log/phoneme-setup.log
# The last line reads SETUP COMPLETE when the app is running.
set -eux
exec > /var/log/phoneme-setup.log 2>&1

# 1. Swap space. The Next.js build needs more memory than the smallest
#    instances have, and swap stops the build being killed half way.
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
fi

# 2. Docker, started now and on every boot (Workshop 6 Part 1).
yum install -y docker git
service docker start
systemctl enable docker
usermod -a -G docker ec2-user

# 3. Docker Buildx, which Compose needs in order to build (Workshop 6 Part 2).
if [ "$(uname -m)" = "x86_64" ]; then BUILDX_ARCH="linux-amd64"; else BUILDX_ARCH="linux-arm64"; fi
mkdir -p /usr/libexec/docker/cli-plugins
curl -SL "https://github.com/docker/buildx/releases/download/v0.20.1/buildx-v0.20.1.${BUILDX_ARCH}" \
  -o /usr/libexec/docker/cli-plugins/docker-buildx
chmod +x /usr/libexec/docker/cli-plugins/docker-buildx

# 4. Docker Compose (Workshop 6 Part 2).
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 5. The project. APP_PORT=80 maps the instance's port 80 to the app, the
#    same "80:3000" mapping as the lab compose file. restart: unless-stopped
#    in docker-compose.yml brings it back whenever the instance restarts.
cd /home/ec2-user
if [ ! -d phoneme-activity-builder ]; then
  git clone https://github.com/ReedStel/phoneme-activity-builder.git
fi
cd phoneme-activity-builder
git pull --ff-only || true
APP_PORT=80 /usr/local/bin/docker-compose up -d --build
chown -R ec2-user:ec2-user /home/ec2-user/phoneme-activity-builder

echo "SETUP COMPLETE"

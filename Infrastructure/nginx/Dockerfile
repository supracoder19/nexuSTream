FROM nginx:alpine

# Copy your config file into the image
COPY ./default.conf /etc/nginx/conf.d/default.conf
# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

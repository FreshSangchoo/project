FROM nginx:latest

# FIXME: This line should be removed before deploying application on EC2
RUN openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -subj "/C=KR/ST=Seoul/L=Yeoksam/O=Ssafy/CN=poppin.kr" -out /poppin.kr.crt -keyout /poppin.kr.key

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]